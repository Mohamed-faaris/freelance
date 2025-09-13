from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import requests
import os
from dotenv import load_dotenv

# Load environment variables
try:
    load_dotenv()
    print("Environment variables loaded successfully")
except Exception as e:
    print(f"Failed to load .env file: {e}")
    raise RuntimeError("Failed to load environment configuration")

# Configuration
LEXIENT_API_BASE = 'https://lexient.one'

# Get bearer token from environment
BEARER_TOKEN = os.getenv('LEXIENT_BEARER_TOKEN')
if not BEARER_TOKEN:
    print("LEXIENT_BEARER_TOKEN not found in environment variables")
    raise RuntimeError("LEXIENT_BEARER_TOKEN environment variable is required but not set")

print("Lexient API configuration loaded successfully")

# Create router
searchRouter = APIRouter()

# Pydantic models
class SearchCriteria(BaseModel):
    name: str
    strictMode: Optional[bool] = False
    searchIn: Optional[str] = None
    establishment: Optional[str] = None

class SearchRequest(BaseModel):
    courtType: str
    name: str
    strictMode: Optional[bool] = False
    searchIn: Optional[str] = None
    establishment: Optional[str] = None

class SearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    page: int
    limit: int
    total: int
    courtType: str
    searchCriteria: Dict[str, Any]
    fallbackMode: Optional[bool] = False
    apiError: Optional[str] = None
    apiResponse: Optional[Dict[str, Any]] = None

@searchRouter.post("/search", response_model=SearchResponse)
async def search_court_cases(
    request: SearchRequest,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    """
    Search court cases across different court types
    """
    try:
        court_type = request.courtType
        search_criteria = {
            "name": request.name,
            "strictMode": request.strictMode,
            "searchIn": request.searchIn,
            "establishment": request.establishment
        }

        print(f'Search request received for court type: {court_type}, page: {page}, limit: {limit}')
        print(f'Search criteria: {search_criteria}')

        # Validate required parameters
        if not court_type:
            raise HTTPException(status_code=400, detail="Court type is required")

        if not request.name:
            raise HTTPException(status_code=400, detail="Party name is required")

        results = []
        api_response = {}

        try:
            # Call Lexient API based on court type
            if court_type == 'consumer-forum':
                api_response = await call_lexient_api('/api/consumer-forum/search', search_criteria, page, limit)
            elif court_type == 'district-court':
                api_response = await call_lexient_api('/api/district-court/search', search_criteria, page, limit)
            elif court_type == 'high-court':
                api_response = await call_lexient_api('/api/high-court/search', search_criteria, page, limit)
            elif court_type == 'supreme-court':
                api_response = await call_lexient_api('/api/supreme-court/search', search_criteria, page, limit)
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid court type. Valid types: consumer-forum, district-court, high-court, supreme-court"
                )

            # Extract results from API response
            results = api_response.get('results') or api_response.get('data') or api_response or []

            print(f"Returning {len(results)} results for {court_type}")

            return SearchResponse(
                results=results,
                page=page,
                limit=limit,
                total=api_response.get('total', len(results)),
                courtType=court_type,
                searchCriteria={
                    "name": request.name,
                    "strictMode": request.strictMode,
                    "searchIn": request.searchIn
                },
                apiResponse=api_response
            )

        except Exception as api_error:
            print(f'Lexient API Error: {str(api_error)}')

            # If Lexient API fails, return mock data as fallback
            print('Falling back to mock data due to API error')

            if court_type == 'consumer-forum':
                results = await get_mock_consumer_forum_data(search_criteria, page, limit)
            elif court_type == 'district-court':
                results = await get_mock_district_court_data(search_criteria, page, limit)
            elif court_type == 'high-court':
                results = await get_mock_high_court_data(search_criteria, page, limit)
            elif court_type == 'supreme-court':
                results = await get_mock_supreme_court_data(search_criteria, page, limit)

            return SearchResponse(
                results=results,
                page=page,
                limit=limit,
                total=len(results),
                courtType=court_type,
                searchCriteria={
                    "name": request.name,
                    "strictMode": request.strictMode,
                    "searchIn": request.searchIn
                },
                fallbackMode=True,
                apiError=str(api_error)
            )

    except HTTPException:
        raise
    except Exception as error:
        print(f'Search API error: {str(error)}')
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(error)}"
        )

# Function to call Lexient API
async def call_lexient_api(endpoint: str, criteria: Dict[str, Any], page: int, limit: int) -> Dict[str, Any]:
    """
    Call Lexient API with given parameters
    """
    url = f"{LEXIENT_API_BASE}{endpoint}?page={page}&limit={limit}"

    print(f'Calling Lexient API: {url}')
    print(f'API criteria: {criteria}')

    headers = {
        'accept': '*/*',
        'Authorization': f'Bearer {BEARER_TOKEN}',
        'Content-Type': 'application/json'
    }

    try:
        response = requests.post(url, json=criteria, headers=headers, timeout=30)

        if not response.ok:
            print(f"Lexient API error: {response.status_code} - {response.text}")
            raise Exception(f"Lexient API error: {response.status_code} - {response.text}")

        data = response.json()
        print(f'Lexient API response received with {len(data) if isinstance(data, list) else "object"} items')
        print(f'API response: {data}')
        return data

    except requests.exceptions.Timeout:
        print("Lexient API request timed out")
        raise Exception("Lexient API request timed out")
    except requests.exceptions.RequestException as e:
        print(f"Lexient API request failed: {e}")
        raise Exception(f"Lexient API request failed: {e}")

# Mock data functions as fallback
async def get_mock_consumer_forum_data(criteria: Dict[str, Any], page: int, limit: int) -> List[Dict[str, Any]]:
    """
    Generate mock consumer forum data
    """
    mock_results = [
        {
            "id": "CF001",
            "caseName": f"{criteria['name']} vs XYZ Company",
            "caseNumber": "CF/2023/001",
            "title": "Consumer Complaint Case",
            "parties": f"{criteria['name']} (Complainant) vs XYZ Company (Opposite Party)",
            "status": "Under Hearing",
            "date": "2023-10-15",
            "filingDate": "2023-09-01",
            "court": "District Consumer Forum",
            "establishment": criteria.get('establishment', "DISTRICT_COMMISSION"),
            "summary": "Consumer complaint regarding defective product and deficiency in service"
        },
        {
            "id": "CF002",
            "caseName": f"ABC Corp vs {criteria['name']}",
            "caseNumber": "CF/2023/002",
            "title": "Commercial Dispute",
            "parties": f"ABC Corp (Complainant) vs {criteria['name']} (Opposite Party)",
            "status": "Disposed",
            "date": "2023-08-20",
            "filingDate": "2023-07-10",
            "court": "State Consumer Commission",
            "establishment": "STATE_COMMISSION",
            "summary": "Dispute over service charges and contract terms"
        }
    ]

    # Apply filtering and pagination
    filtered_results = [
        result for result in mock_results
        if criteria['name'].lower() in result['caseName'].lower() or
           criteria['name'].lower() in result['parties'].lower()
    ]

    start_index = (page - 1) * limit
    return filtered_results[start_index:start_index + limit]

async def get_mock_district_court_data(criteria: Dict[str, Any], page: int, limit: int) -> List[Dict[str, Any]]:
    """
    Generate mock district court data
    """
    mock_results = [
        {
            "id": "DC001",
            "caseName": f"{criteria['name']} vs State",
            "caseNumber": "DC/CRL/2023/001",
            "title": "Criminal Case",
            "parties": f"{criteria['name']} (Accused) vs State (Complainant)",
            "status": "Trial",
            "date": "2023-11-01",
            "filingDate": "2023-05-15",
            "court": "District Court, Mumbai",
            "summary": "Criminal proceedings under relevant sections"
        },
        {
            "id": "DC002",
            "caseName": f"{criteria['name']} vs John Doe",
            "caseNumber": "DC/CIV/2023/002",
            "title": "Civil Suit",
            "parties": f"{criteria['name']} (Plaintiff) vs John Doe (Defendant)",
            "status": "Judgment Reserved",
            "date": "2023-10-25",
            "filingDate": "2023-03-20",
            "court": "District Court, Delhi",
            "summary": "Civil dispute over property rights"
        }
    ]

    filtered_results = [
        result for result in mock_results
        if criteria['name'].lower() in result['caseName'].lower() or
           criteria['name'].lower() in result['parties'].lower()
    ]

    start_index = (page - 1) * limit
    return filtered_results[start_index:start_index + limit]

async def get_mock_high_court_data(criteria: Dict[str, Any], page: int, limit: int) -> List[Dict[str, Any]]:
    """
    Generate mock high court data
    """
    mock_results = [
        {
            "id": "HC001",
            "caseName": f"{criteria['name']} vs Union of India",
            "caseNumber": "HC/WP/2023/001",
            "title": "Writ Petition",
            "parties": f"{criteria['name']} (Petitioner) vs Union of India (Respondent)",
            "status": "Admitted",
            "date": "2023-12-01",
            "filingDate": "2023-11-10",
            "court": "Delhi High Court",
            "summary": "Writ petition challenging government policy"
        }
    ]

    filtered_results = [
        result for result in mock_results
        if criteria['name'].lower() in result['caseName'].lower() or
           criteria['name'].lower() in result['parties'].lower()
    ]

    start_index = (page - 1) * limit
    return filtered_results[start_index:start_index + limit]

async def get_mock_supreme_court_data(criteria: Dict[str, Any], page: int, limit: int) -> List[Dict[str, Any]]:
    """
    Generate mock supreme court data
    """
    mock_results = [
        {
            "id": "SC001",
            "caseName": f"{criteria['name']} vs State of Maharashtra",
            "caseNumber": "SC/SLP/2023/001",
            "title": "Special Leave Petition",
            "parties": f"{criteria['name']} (Petitioner) vs State of Maharashtra (Respondent)",
            "status": "Listed",
            "date": "2023-12-15",
            "filingDate": "2023-11-25",
            "court": "Supreme Court of India",
            "summary": "Appeal against High Court judgment"
        }
    ]

    filtered_results = [
        result for result in mock_results
        if criteria['name'].lower() in result['caseName'].lower() or
           criteria['name'].lower() in result['parties'].lower()
    ]

    start_index = (page - 1) * limit
    return filtered_results[start_index:start_index + limit]
