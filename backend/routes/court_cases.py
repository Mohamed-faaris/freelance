from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request, Query, Depends
from pydantic import BaseModel, field_validator, ValidationError
from typing import Optional, Dict, Any, List
import requests
import os
import json
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
import re
from functools import reduce

# Import utilities
from utils import (
    authenticate_request,
    get_authenticated_user,
)

# Load environment variables
try:
    import dotenv
    dotenv.load_dotenv()
    print("Environment variables loaded successfully")
except Exception as e:
    print(f"Failed to load .env file: {e}")

# ===== CONFIGURATION =====
class Config:
    JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
    LEXIENT_API_KEY = "lex_27b69273dea7e1fcd979feb9215d7f41"
    HIGH_COURT_API = "https://lexient.one/api/high-court/search"
    DISTRICT_COURT_API = "https://lexient.one/api/district-court/search"
    MAX_PAGES = 2
    RESULTS_PER_PAGE = 10
    REQUEST_TIMEOUT = 30
    STORAGE_DIR = Path.cwd() / "data" / "court-cases"
    CACHE_DURATION = timedelta(hours=24)  # 24 hours

CONFIG = Config()

# ===== TYPE DEFINITIONS =====
class PersonalInfo(BaseModel):
    full_name: Optional[str] = None
    fullName: Optional[str] = None
    father_name: Optional[str] = None
    fatherName: Optional[str] = None
    dob: Optional[str] = None
    dateOfBirth: Optional[str] = None
    pan_number: Optional[str] = None
    panNumber: Optional[str] = None
    aadhaar_number: Optional[str] = None
    aadhaarNumber: Optional[str] = None
    gender: Optional[str] = None

class ProfileData(BaseModel):
    personalInfo: Optional[PersonalInfo] = None
    contactInfo: Optional[Dict[str, Any]] = None
    digitalInfo: Optional[Dict[str, Any]] = None
    employmentInfo: Optional[Dict[str, Any]] = None
    businessInfo: Optional[Dict[str, Any]] = None
    creditInfo: Optional[Dict[str, Any]] = None
    drivingInfo: Optional[Dict[str, Any]] = None
    vehicleInfo: Optional[Dict[str, Any]] = None
    rawProfileData: Optional[Dict[str, Any]] = None
    business_name: Optional[str] = None
    legal_name: Optional[str] = None
    addresses: Optional[List[str]] = None

class SearchParameters(BaseModel):
    strictMode: bool = True
    searchIn: str = "respondent"
    includeAddress: bool = True

    @field_validator('searchIn')
    @classmethod
    def validate_search_in(cls, v):
        if v not in ['petitioner', 'respondent', 'both']:
            raise ValueError('searchIn must be one of: petitioner, respondent, both')
        return v

class CourtCase(BaseModel):
    score: float
    cnr: str
    title: str
    petitioners: List[str]
    respondents: List[str]
    filingDate: str
    stage: str
    court: Optional[str] = None
    location: Optional[str] = None
    relevanceScore: Optional[float] = None
    ageAtFiling: Optional[int] = None
    isValid: Optional[bool] = None
    filterReason: Optional[str] = None

class SearchResponse(BaseModel):
    data: List[CourtCase]
    totalCount: int
    page: int
    limit: int

class APIResponse(BaseModel):
    success: bool
    data: List[CourtCase]
    totalValidCases: int
    totalFetchedCases: int
    filteredOutCases: int
    profile: ProfileData
    searchSummary: Dict[str, Any]
    fileName: Optional[str] = None
    fromCache: Optional[bool] = None

class StoredCaseData(BaseModel):
    profile: ProfileData
    searchParams: SearchParameters
    timestamp: float
    rawCases: List[CourtCase]
    validCases: List[CourtCase]
    invalidCases: List[CourtCase]
    searchSummary: Dict[str, Any]
    fileName: str

# ===== PROFILE UTILITIES =====
class ProfileUtils:
    @staticmethod
    def extract_name(profile: ProfileData) -> Optional[str]:
        """Extract name using the same logic as the React component"""
        if profile.personalInfo:
            if profile.personalInfo.full_name:
                return profile.personalInfo.full_name
            if profile.personalInfo.fullName:
                return profile.personalInfo.fullName

        if profile.business_name:
            return profile.business_name

        if profile.legal_name:
            return profile.legal_name

        if profile.rawProfileData and profile.rawProfileData.get("personalInfo", {}).get("fullName"):
            return profile.rawProfileData["personalInfo"]["fullName"]

        return None

    @staticmethod
    def extract_birth_year(profile: ProfileData) -> Optional[int]:
        """Extract birth year from various date formats"""
        dob = None

        if profile.personalInfo:
            dob = profile.personalInfo.dob or profile.personalInfo.dateOfBirth

        if not dob and profile.rawProfileData:
            raw_personal = profile.rawProfileData.get("personalInfo", {})
            dob = raw_personal.get("dob") or raw_personal.get("dateOfBirth")

        if not dob:
            return None

        try:
            date_obj = datetime.fromisoformat(dob.replace('Z', '+00:00'))
            year = date_obj.year

            # Validate reasonable birth year range
            current_year = datetime.now().year
            if 1900 <= year <= current_year:
                return year
        except (ValueError, AttributeError) as e:
            print(f"Error parsing date of birth: {dob}, error: {e}")

        return None

    @staticmethod
    def extract_addresses(profile: ProfileData) -> List[str]:
        """Extract addresses from various sources"""
        addresses = []

        # Add explicit addresses array
        if profile.addresses:
            addresses.extend(profile.addresses)

        # Extract from contact info
        if profile.contactInfo:
            contact_addresses = [
                profile.contactInfo.get("address"),
                profile.contactInfo.get("permanent_address"),
                profile.contactInfo.get("current_address"),
                profile.contactInfo.get("office_address"),
            ]
            addresses.extend([addr for addr in contact_addresses if addr])

        # Extract from employment info
        if profile.employmentInfo:
            work_addresses = [
                profile.employmentInfo.get("company_address"),
                profile.employmentInfo.get("office_location"),
                profile.employmentInfo.get("work_address"),
            ]
            addresses.extend([addr for addr in work_addresses if addr])

        # Extract from business info
        if profile.businessInfo:
            business_addresses = [
                profile.businessInfo.get("registered_address"),
                profile.businessInfo.get("business_address"),
                profile.businessInfo.get("office_address"),
            ]
            addresses.extend([addr for addr in business_addresses if addr])

        # Remove duplicates and empty values, and filter out very short addresses
        cleaned_addresses = []
        for addr in addresses:
            if addr and addr.strip() and len(addr.strip()) > 3:  # Minimum 3 characters
                cleaned_addresses.append(addr.strip())

        # Remove duplicates while preserving order
        seen = set()
        unique_addresses = []
        for addr in cleaned_addresses:
            addr_lower = addr.lower()
            if addr_lower not in seen:
                seen.add(addr_lower)
                unique_addresses.append(addr)

        return unique_addresses

    @staticmethod
    def validate_profile(profile: ProfileData) -> Dict[str, Any]:
        """Validate if profile has minimum required data"""
        name = ProfileUtils.extract_name(profile)
        if not name:
            return {"valid": False, "error": "No name found in profile data"}

        # Birth year is now optional - analysis will work without it
        # birth_year = ProfileUtils.extract_birth_year(profile)
        # if not birth_year:
        #     return {"valid": False, "error": "No valid date of birth found in profile data"}

        return {"valid": True}

# ===== UTILITY SERVICES =====
class DateUtils:
    @staticmethod
    def calculate_age(birth_year: int, target_date: datetime) -> int:
        """Calculate age at a given date"""
        return target_date.year - birth_year

    @staticmethod
    def parse_filing_date(date_string: str) -> datetime:
        """Parse filing date string"""
        try:
            return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            print(f"Failed to parse date: {date_string}")
            return datetime.now()

    @staticmethod
    def is_valid_adult_case(birth_year: int, filing_date: str) -> bool:
        """Check if person was adult when case was filed"""
        try:
            filing = DateUtils.parse_filing_date(filing_date)
            age_at_filing = DateUtils.calculate_age(birth_year, filing)
            return age_at_filing >= 18
        except Exception as e:
            print(f"Error validating adult case: {e}")
            return False

class StringUtils:
    @staticmethod
    def normalize_string(text: str) -> str:
        """Normalize string for comparison"""
        return re.sub(r'[^\w\s]', '', text.lower()).replace(r'\s+', ' ').strip()

    @staticmethod
    def calculate_name_similarity(name1: str, name2: str) -> float:
        """Calculate name similarity score"""
        normalized1 = StringUtils.normalize_string(name1)
        normalized2 = StringUtils.normalize_string(name2)

        if normalized1 == normalized2:
            return 1.0

        words1 = normalized1.split()
        words2 = normalized2.split()

        matches = 0
        total_words = max(len(words1), len(words2))

        for word1 in words1:
            if any(word2 in word1 or word1 in word2 for word2 in words2):
                matches += 1

        return matches / total_words if total_words > 0 else 0.0

    @staticmethod
    def extract_location_from_title(title: str) -> Optional[str]:
        """Extract location from case title"""
        location_patterns = [
            r'vs\.?\s+(.+?)(?:\s+and|$)',
            r'against\s+(.+?)(?:\s+and|$)',
        ]

        for pattern in location_patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match and match.group(1):
                return match.group(1).strip()

        return None

# ===== FILE STORAGE SERVICE =====
class FileStorageService:
    @staticmethod
    def ensure_storage_directory():
        """Ensure storage directory exists"""
        CONFIG.STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def generate_file_name(profile: ProfileData) -> str:
        """Generate filename for storing case data"""
        name = ProfileUtils.extract_name(profile)
        birth_year = ProfileUtils.extract_birth_year(profile)

        if not name:
            raise ValueError("Cannot generate filename: missing name")

        # Use birth year if available, otherwise use placeholder
        year_part = str(birth_year) if birth_year else "unknown"

        normalized_name = re.sub(r'[^a-z0-9]', '_', name.lower())
        normalized_name = re.sub(r'_+', '_', normalized_name).strip('_')

        timestamp = datetime.now().strftime('%Y-%m-%d')
        return f"{normalized_name}_{year_part}_{timestamp}.json"

    @staticmethod
    async def save_case_data(
        profile: ProfileData,
        search_params: SearchParameters,
        raw_cases: List[CourtCase],
        valid_cases: List[CourtCase],
        invalid_cases: List[CourtCase],
        search_summary: Dict[str, Any]
    ) -> str:
        """Save case data to JSON file"""
        try:
            FileStorageService.ensure_storage_directory()

            file_name = FileStorageService.generate_file_name(profile)
            file_path = CONFIG.STORAGE_DIR / file_name

            data_to_store = StoredCaseData(
                profile=profile,
                searchParams=search_params,
                timestamp=datetime.now().timestamp(),
                rawCases=raw_cases,
                validCases=valid_cases,
                invalidCases=invalid_cases,
                searchSummary=search_summary,
                fileName=file_name
            )

            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data_to_store.model_dump(), f, indent=2, ensure_ascii=False)

            print(f"Court case data saved to: {file_name}")
            return file_name

        except Exception as e:
            print(f"Error saving case data: {e}")
            raise Exception("Failed to save case data to file")

    @staticmethod
    async def load_case_data(file_name: str) -> Optional[StoredCaseData]:
        """Load case data from JSON file"""
        try:
            file_path = CONFIG.STORAGE_DIR / file_name

            with open(file_path, 'r', encoding='utf-8') as f:
                data_dict = json.load(f)

            data = StoredCaseData(**data_dict)

            # Check if data is still fresh
            data_age = datetime.now() - datetime.fromtimestamp(data.timestamp)
            if data_age > CONFIG.CACHE_DURATION:
                print(f"Cache expired for {file_name}")
                return None

            return data

        except Exception as e:
            print(f"Could not load cached data from {file_name}: {e}")
            return None

    @staticmethod
    async def find_existing_file(profile: ProfileData) -> Optional[str]:
        """Find existing file for profile"""
        try:
            FileStorageService.ensure_storage_directory()
            files = list(CONFIG.STORAGE_DIR.glob("*.json"))

            name = ProfileUtils.extract_name(profile)
            birth_year = ProfileUtils.extract_birth_year(profile)

            if not name:
                return None

            normalized_name = re.sub(r'[^a-z0-9]', '_', name.lower())
            normalized_name = re.sub(r'_+', '_', normalized_name).strip('_')

            # Use birth year if available, otherwise use placeholder
            year_part = str(birth_year) if birth_year else "unknown"

            # Look for files matching the user profile
            matching_files = [
                f.name for f in files
                if f.name.startswith(f"{normalized_name}_{year_part}_") and f.name.endswith('.json')
            ]

            if not matching_files:
                return None

            # Return the most recent file
            return max(matching_files)

        except Exception as e:
            print(f"Error finding existing files: {e}")
            return None

    @staticmethod
    async def list_all_case_files() -> List[str]:
        """List all case files"""
        try:
            FileStorageService.ensure_storage_directory()
            files = list(CONFIG.STORAGE_DIR.glob("*.json"))
            return [f.name for f in files]
        except Exception as e:
            print(f"Error listing case files: {e}")
            return []

    @staticmethod
    async def delete_old_files(days_old: int = 30) -> int:
        """Delete old files"""
        try:
            FileStorageService.ensure_storage_directory()
            files = list(CONFIG.STORAGE_DIR.glob("*.json"))
            cutoff_time = datetime.now() - timedelta(days=days_old)

            deleted_count = 0
            for file_path in files:
                if file_path.stat().st_mtime < cutoff_time.timestamp():
                    file_path.unlink()
                    deleted_count += 1
                    print(f"Deleted old case file: {file_path.name}")

            return deleted_count

        except Exception as e:
            print(f"Error deleting old files: {e}")
            return 0

# ===== COURT API SERVICE =====
class CourtAPIService:
    @staticmethod
    async def make_api_call(url: str, payload: Dict[str, Any], page: int = 1) -> Optional[Dict[str, Any]]:
        """Make API call to Lexient"""
        try:
            full_url = f"{url}?page={page}&limit={CONFIG.RESULTS_PER_PAGE}"

            headers = {
                'accept': '*/*',
                'Authorization': f'Bearer {CONFIG.LEXIENT_API_KEY}',
                'Content-Type': 'application/json'
            }

            print(f"Making API call to: {full_url}")
            print(f"Payload: {payload}")

            response = requests.post(
                full_url,
                json=payload,
                headers=headers,
                timeout=CONFIG.REQUEST_TIMEOUT
            )

            if not response.ok:
                print(f"API call failed: {response.status_code} {response.text}")
                return None

            data = response.json()
            print(f"API response type: {type(data)}")

            # Handle different response formats
            if isinstance(data, list):
                # If response is a list, wrap it in expected format
                return {
                    "data": data,
                    "totalCount": len(data),
                    "page": page,
                    "limit": CONFIG.RESULTS_PER_PAGE
                }
            elif isinstance(data, dict):
                # If response is already a dict, ensure it has the expected structure
                if "data" not in data and "results" in data:
                    data["data"] = data["results"]
                elif "data" not in data:
                    data["data"] = []
                return data
            else:
                print(f"Unexpected response format: {type(data)}")
                return None

        except Exception as e:
            print(f"API call error for {url}: {e}")
            return None

    @staticmethod
    async def search_high_court(profile: ProfileData, search_params: SearchParameters) -> List[CourtCase]:
        """Search high court cases"""
        cases = []

        search_queries = CourtAPIService._generate_search_queries(profile, search_params)

        for query in search_queries:
            for page in range(1, CONFIG.MAX_PAGES + 1):
                response = await CourtAPIService.make_api_call(CONFIG.HIGH_COURT_API, query, page)

                if response and response.get('data'):
                    try:
                        enriched_cases = []
                        for case_data in response['data']:
                            if isinstance(case_data, dict):
                                case_dict = dict(case_data)
                                case_dict.update({
                                    'court': 'High Court',
                                    'location': StringUtils.extract_location_from_title(case_data.get('title', ''))
                                })
                                enriched_cases.append(CourtCase(**case_dict))
                            else:
                                print(f"Skipping invalid case data: {case_data}")

                        cases.extend(enriched_cases)
                        print(f"Added {len(enriched_cases)} cases from High Court page {page}")

                    except Exception as e:
                        print(f"Error processing High Court response: {e}")
                        continue

                # If we got fewer results than the limit, no more pages available
                if not response or not response.get('data') or len(response['data']) < CONFIG.RESULTS_PER_PAGE:
                    break

        print(f"Total High Court cases found: {len(cases)}")
        return cases

    @staticmethod
    async def search_district_court(profile: ProfileData, search_params: SearchParameters) -> List[CourtCase]:
        """Search district court cases"""
        cases = []

        search_queries = CourtAPIService._generate_search_queries(profile, search_params)

        for query in search_queries:
            for page in range(1, CONFIG.MAX_PAGES + 1):
                response = await CourtAPIService.make_api_call(CONFIG.DISTRICT_COURT_API, query, page)

                if response and response.get('data'):
                    try:
                        enriched_cases = []
                        for case_data in response['data']:
                            if isinstance(case_data, dict):
                                case_dict = dict(case_data)
                                case_dict.update({
                                    'court': 'District Court',
                                    'location': StringUtils.extract_location_from_title(case_data.get('title', ''))
                                })
                                enriched_cases.append(CourtCase(**case_dict))
                            else:
                                print(f"Skipping invalid case data: {case_data}")

                        cases.extend(enriched_cases)
                        print(f"Added {len(enriched_cases)} cases from District Court page {page}")

                    except Exception as e:
                        print(f"Error processing District Court response: {e}")
                        continue

                # If we got fewer results than the limit, no more pages available
                if not response or not response.get('data') or len(response['data']) < CONFIG.RESULTS_PER_PAGE:
                    break

        print(f"Total District Court cases found: {len(cases)}")
        return cases

    @staticmethod
    def _generate_search_queries(profile: ProfileData, search_params: SearchParameters) -> List[Dict[str, Any]]:
        """Generate search queries"""
        queries = []
        name = ProfileUtils.extract_name(profile)

        if not name:
            print("No name found for search queries")
            return []

        addresses = ProfileUtils.extract_addresses(profile)
        print(f"Found {len(addresses)} addresses for search: {addresses[:3]}...")  # Show first 3 addresses

        # Only search with addresses if we have them and includeAddress is true
        if search_params.includeAddress and addresses:
            # Search with each available address
            for address in addresses:
                if address and address.strip():  # Only add non-empty addresses
                    queries.append({
                        "name": name,
                        "address": address.strip(),
                        "strictMode": search_params.strictMode,
                        "searchIn": search_params.searchIn,
                    })
        else:
            # If no addresses or includeAddress is false, search without address requirement
            # Try with common Indian cities as fallbacks
            fallback_addresses = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata"]
            for address in fallback_addresses[:2]:  # Use first 2 fallback addresses
                queries.append({
                    "name": name,
                    "address": address,
                    "strictMode": search_params.strictMode,
                    "searchIn": search_params.searchIn,
                })

        print(f"Generated {len(queries)} search queries")
        return queries

# ===== CASE ANALYSIS SERVICE =====
class CaseAnalysisService:
    @staticmethod
    def analyze_cases(cases: List[CourtCase], profile: ProfileData) -> Dict[str, Any]:
        """Analyze and filter cases"""
        valid_cases = []
        invalid_cases = []
        cases_removed_for_age = 0

        birth_year = ProfileUtils.extract_birth_year(profile)

        for case in cases:
            analysis_result = CaseAnalysisService._analyze_case(case, profile, birth_year)

            if analysis_result['isValid']:
                valid_cases.append(analysis_result['case'])
            else:
                invalid_cases.append(analysis_result['case'])
                if analysis_result['case'].filterReason and 'age' in analysis_result['case'].filterReason:
                    cases_removed_for_age += 1

        # Sort valid cases by relevance score
        valid_cases.sort(key=lambda c: c.relevanceScore or 0, reverse=True)

        summary = {
            "highCourtCases": len([c for c in valid_cases if c.court == 'High Court']),
            "districtCourtCases": len([c for c in valid_cases if c.court == 'District Court']),
            "casesRemovedForAge": cases_removed_for_age,
            "averageRelevanceScore": (
                sum((c.relevanceScore or 0) for c in valid_cases) / len(valid_cases)
                if valid_cases else 0
            ),
        }

        return {
            "validCases": valid_cases,
            "invalidCases": invalid_cases,
            "summary": summary
        }

    @staticmethod
    def _analyze_case(case: CourtCase, profile: ProfileData, birth_year: Optional[int]) -> Dict[str, Any]:
        """Analyze individual case"""
        enhanced_case = CourtCase(**case.model_dump())

        # Calculate age at filing if birth year is available
        if birth_year:
            filing_date = DateUtils.parse_filing_date(case.filingDate)
            enhanced_case.ageAtFiling = DateUtils.calculate_age(birth_year, filing_date)

            # Check if person was adult when case was filed
            is_adult_case = DateUtils.is_valid_adult_case(birth_year, case.filingDate)

            if not is_adult_case:
                enhanced_case.isValid = False
                enhanced_case.filterReason = f"Case filed when person was {enhanced_case.ageAtFiling} years old (below 18)"
                return {"case": enhanced_case, "isValid": False}

        # Calculate relevance score
        enhanced_case.relevanceScore = CaseAnalysisService._calculate_relevance_score(case, profile)
        enhanced_case.isValid = True

        return {"case": enhanced_case, "isValid": True}

    @staticmethod
    def _calculate_relevance_score(case: CourtCase, profile: ProfileData) -> float:
        """Calculate relevance score for a case"""
        score = case.score or 0.0  # Base API score

        name = ProfileUtils.extract_name(profile)
        if not name:
            return score

        # Name similarity bonus
        respondent_names = ' '.join(case.respondents)
        petitioner_names = ' '.join(case.petitioners)

        respondent_similarity = StringUtils.calculate_name_similarity(name, respondent_names)
        petitioner_similarity = StringUtils.calculate_name_similarity(name, petitioner_names)

        score += max(respondent_similarity, petitioner_similarity) * 20

        # Location relevance bonus
        if case.location:
            addresses = ProfileUtils.extract_addresses(profile)

            for address in addresses:
                if address and address.lower() in case.location.lower():
                    score += 10
                    break

        # Recent case bonus
        filing_year = DateUtils.parse_filing_date(case.filingDate).year
        current_year = datetime.now().year
        year_diff = current_year - filing_year

        if year_diff <= 2:
            score += 5
        elif year_diff <= 5:
            score += 3
        elif year_diff <= 10:
            score += 1

        # Court type consideration
        if case.court == 'High Court':
            score += 2

        return round(score * 100) / 100

# ===== AUTHENTICATION DEPENDENCY =====
async def get_current_user(request: Request):
    """Dependency to get current authenticated user via JWT"""
    return await get_authenticated_user(request)

    return user_doc

# ===== REQUEST/RESPONSE MODELS =====
class CourtCaseSearchRequest(BaseModel):
    profile: ProfileData
    searchParams: Optional[SearchParameters] = SearchParameters()

# ===== ROUTER =====
court_cases_router = APIRouter()

@court_cases_router.post("/", response_model=APIResponse)
async def search_court_cases(
    request_data: CourtCaseSearchRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Search court cases for a given profile
    """
    try:
        profile = request_data.profile
        search_params = request_data.searchParams or SearchParameters()

        # Validate profile has required data
        profile_validation = ProfileUtils.validate_profile(profile)
        if not profile_validation["valid"]:
            raise HTTPException(
                status_code=400,
                detail=profile_validation["error"]
            )

        name = ProfileUtils.extract_name(profile)
        birth_year = ProfileUtils.extract_birth_year(profile)

        print(f"Searching court cases for {name} (born {birth_year})...")

        # Check for existing cached data
        existing_file_name = await FileStorageService.find_existing_file(profile)
        if existing_file_name:
            cached_data = await FileStorageService.load_case_data(existing_file_name)

            if cached_data:
                print(f"Returning cached data from {existing_file_name}")

                return APIResponse(
                    success=True,
                    data=cached_data.validCases,
                    totalValidCases=len(cached_data.validCases),
                    totalFetchedCases=len(cached_data.rawCases),
                    filteredOutCases=len(cached_data.invalidCases),
                    profile=cached_data.profile,
                    searchSummary=cached_data.searchSummary,
                    fileName=cached_data.fileName,
                    fromCache=True
                )

        # Perform fresh API searches
        print("No valid cache found. Fetching fresh data from APIs...")

        try:
            high_court_cases, district_court_cases = await asyncio.gather(
                CourtAPIService.search_high_court(profile, search_params),
                CourtAPIService.search_district_court(profile, search_params),
                return_exceptions=True
            )

            # Handle exceptions from API calls
            if isinstance(high_court_cases, Exception):
                print(f"High Court search failed: {high_court_cases}")
                high_court_cases = []

            if isinstance(district_court_cases, Exception):
                print(f"District Court search failed: {district_court_cases}")
                district_court_cases = []

        except Exception as e:
            print(f"Error during API searches: {e}")
            high_court_cases = []
            district_court_cases = []

        # Combine and deduplicate results
        all_cases = high_court_cases + district_court_cases
        unique_cases = []
        seen_cnrs = set()

        for case in all_cases:
            if hasattr(case, 'cnr') and case.cnr and case.cnr not in seen_cnrs:
                unique_cases.append(case)
                seen_cnrs.add(case.cnr)

        print(f"Found {len(unique_cases)} unique cases before filtering")

        if not unique_cases:
            print("No cases found from API searches")
            # Return empty result instead of crashing
            return APIResponse(
                success=True,
                data=[],
                totalValidCases=0,
                totalFetchedCases=0,
                filteredOutCases=0,
                profile=profile,
                searchSummary={
                    "highCourtCases": 0,
                    "districtCourtCases": 0,
                    "casesRemovedForAge": 0,
                    "averageRelevanceScore": 0,
                },
                fileName=None,
                fromCache=False
            )

        # Analyze and filter cases
        analysis = CaseAnalysisService.analyze_cases(unique_cases, profile)

        print(f"Valid cases after analysis: {len(analysis['validCases'])}")

        # Save data to JSON file
        file_name = await FileStorageService.save_case_data(
            profile,
            search_params,
            unique_cases,
            analysis["validCases"],
            analysis["invalidCases"],
            analysis["summary"]
        )

        # Clean up old files (async, don't wait for it)
        asyncio.create_task(FileStorageService.delete_old_files(30))

        return APIResponse(
            success=True,
            data=analysis["validCases"],
            totalValidCases=len(analysis["validCases"]),
            totalFetchedCases=len(unique_cases),
            filteredOutCases=len(analysis["invalidCases"]),
            profile=profile,
            searchSummary=analysis["summary"],
            fileName=file_name,
            fromCache=False
        )

    except ValidationError as e:
        raise HTTPException(status_code=400, detail=f"Invalid request data: {e}")
    except Exception as e:
        print(f"Court case search error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@court_cases_router.get("/")
async def get_court_cases_info(
    action: Optional[str] = Query(None),
    fileName: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get court cases information and perform various operations
    """
    try:
        # Handle different GET actions
        if action == "files":
            files = await FileStorageService.list_all_case_files()
            return {"files": files, "count": len(files)}

        if action == "load" and fileName:
            data = await FileStorageService.load_case_data(fileName)
            if not data:
                raise HTTPException(status_code=404, detail="File not found or expired")
            return data

        if action == "cleanup":
            deleted_count = await FileStorageService.delete_old_files(30)
            return {
                "message": f"Cleaned up {deleted_count} old files",
                "deletedCount": deleted_count
            }

        # Default health check
        return {
            "message": "Court Case Search API is running",
            "version": "1.2.0",
            "supportedCourts": ["high-court", "district-court"],
            "features": {
                "authentication": True,
                "ageFiltering": True,
                "relevanceScoring": True,
                "multiLocationSearch": True,
                "deduplication": True,
                "fileStorage": True,
                "caching": True,
                "advancedProfileSupport": True,
            },
            "limits": {
                "maxPages": CONFIG.MAX_PAGES,
                "resultsPerPage": CONFIG.RESULTS_PER_PAGE,
                "timeout": CONFIG.REQUEST_TIMEOUT,
                "cacheDuration": CONFIG.CACHE_DURATION.total_seconds(),
            },
            "storage": {
                "directory": str(CONFIG.STORAGE_DIR),
                "supportedActions": ["files", "load", "cleanup"],
            },
            "profileSupport": {
                "extractsNameFrom": [
                    "personalInfo.full_name",
                    "personalInfo.fullName",
                    "business_name",
                    "legal_name",
                    "rawProfileData.personalInfo.fullName"
                ],
                "extractsBirthFrom": [
                    "personalInfo.dob",
                    "personalInfo.dateOfBirth",
                    "rawProfileData.personalInfo.dob",
                    "rawProfileData.personalInfo.dateOfBirth"
                ],
                "extractsAddressesFrom": [
                    "addresses[]",
                    "contactInfo.*address",
                    "employmentInfo.*address",
                    "businessInfo.*address"
                ]
            },
            "status": "healthy"
        }

    except Exception as e:
        print(f"Court cases info error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
