from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    FAILED = "failed"
    NOT_FOUND = "not_found"
    PENDING = "pending"

class Gender(str, Enum):
    MALE = "M"
    FEMALE = "F"
    OTHER = "O"

class UanSourceType(str, Enum):
    PAN = "pan"
    AADHAAR = "aadhaar"

# Validators

def pan_validator(v: str) -> str:
    import re
    if v is not None and not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", v):
        raise ValueError("Invalid PAN number")
    return v

def mobile_validator(v: str) -> str:
    import re
    if v is not None and not re.match(r"^[6-9]\d{9}$", v):
        raise ValueError("Invalid mobile number")
    return v

def aadhaar_validator(v: str) -> str:
    import re
    if v is not None and not re.match(r"^\d{12}$", v):
        raise ValueError("Invalid Aadhaar number")
    return v

# Nested Models
class PersonalInfo(BaseModel):
    name: str
    dob: str
    mobile: str
    aadhaar: Optional[str] = None
    pan: Optional[str] = None
    dl: Optional[str] = None
    rcNumber: Optional[str] = None
    uanNumber: Optional[str] = None

    _validate_mobile = validator('mobile', allow_reuse=True)(mobile_validator)
    _validate_aadhaar = validator('aadhaar', allow_reuse=True)(aadhaar_validator)
    _validate_pan = validator('pan', allow_reuse=True)(pan_validator)

class AadhaarVerification(BaseModel):
    aadhaarNumber: str
    ageRange: Optional[str] = None
    state: Optional[str] = None
    gender: Optional[Gender] = None
    lastDigits: Optional[str] = None
    isMobile: Optional[bool] = None
    verificationStatus: VerificationStatus
    verifiedAt: datetime

    _validate_aadhaar = validator('aadhaarNumber', allow_reuse=True)(aadhaar_validator)

class PanVerification(BaseModel):
    panNumber: str
    fullName: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    cleanedName: Optional[str] = None
    verificationStatus: VerificationStatus
    verifiedAt: datetime

    _validate_pan = validator('panNumber', allow_reuse=True)(pan_validator)

class DlCovDetail(BaseModel):
    cov: Optional[str] = None
    issueDate: Optional[str] = None
    category: Optional[str] = None

class DlVerification(BaseModel):
    dlNumber: str
    name: Optional[str] = None
    relativeName: Optional[str] = None
    address: Optional[str] = None
    issuingRto: Optional[str] = None
    dateOfIssue: Optional[str] = None
    validFrom: Optional[str] = None
    validTo: Optional[str] = None
    covDetails: Optional[List[DlCovDetail]] = None
    verificationStatus: VerificationStatus
    verifiedAt: datetime
    requestId: Optional[str] = None

class RcAdvancedVerification(BaseModel):
    rcNumber: str
    registrationDate: Optional[str] = None
    ownerName: Optional[str] = None
    fatherName: Optional[str] = None
    presentAddress: Optional[str] = None
    permanentAddress: Optional[str] = None
    vehicleCategory: Optional[str] = None
    vehicleChasiNumber: Optional[str] = None
    vehicleEngineNumber: Optional[str] = None
    makerDescription: Optional[str] = None
    makerModel: Optional[str] = None
    bodyType: Optional[str] = None
    fuelType: Optional[str] = None
    color: Optional[str] = None
    normsType: Optional[str] = None
    fitUpTo: Optional[str] = None
    financer: Optional[str] = None
    financed: Optional[bool] = None
    insuranceCompany: Optional[str] = None
    insurancePolicyNumber: Optional[str] = None
    insuranceUpto: Optional[str] = None
    manufacturingDate: Optional[str] = None
    registeredAt: Optional[str] = None
    cubicCapacity: Optional[str] = None
    seatingCapacity: Optional[str] = None
    rcStatus: Optional[str] = None
    verificationStatus: VerificationStatus
    verifiedAt: datetime

class RcChallanDetail(BaseModel):
    challanNumber: str
    offenseDetails: str
    challanPlace: Optional[str] = None
    challanDate: str
    amount: float
    challanStatus: str
    accusedName: Optional[str] = None

class RcChallanVerification(BaseModel):
    rcNumber: str
    totalChallans: Optional[int] = None
    totalAmount: Optional[float] = None
    latestChallanDate: Optional[str] = None
    challanDetails: Optional[List[RcChallanDetail]] = None
    verificationStatus: VerificationStatus
    verifiedAt: datetime

class UanVerification(BaseModel):
    uanNumber: str
    source: UanSourceType
    sourceNumber: str
    verificationStatus: VerificationStatus
    verifiedAt: datetime

class EmploymentHistoryDetail(BaseModel):
    name: str
    guardianName: Optional[str] = None
    establishmentName: str
    memberId: Optional[str] = None
    dateOfJoining: str
    dateOfExit: Optional[str] = None
    lastPfSubmitted: Optional[str] = None

class EmploymentHistoryVerification(BaseModel):
    uanNumber: str
    employmentHistory: Optional[List[EmploymentHistoryDetail]] = None
    verificationStatus: VerificationStatus
    verifiedAt: datetime

class MobileToPANVerification(BaseModel):
    mobileNumber: str
    panNumber: Optional[str] = None
    fullName: Optional[str] = None
    fullNameSplit: Optional[List[str]] = None
    maskedAadhaar: Optional[str] = None
    gender: Optional[Gender] = None
    dob: Optional[str] = None
    aadhaarLinked: Optional[bool] = None
    dobVerified: Optional[bool] = None
    category: Optional[str] = None
    verificationStatus: VerificationStatus
    verifiedAt: datetime

    _validate_mobile = validator('mobileNumber', allow_reuse=True)(mobile_validator)
    _validate_pan = validator('panNumber', allow_reuse=True)(pan_validator)

class PersonalMiniProfile(BaseModel):
    personalInfo: PersonalInfo
    aadhaarVerification: Optional[AadhaarVerification] = None
    panVerification: Optional[PanVerification] = None
    dlVerification: Optional[DlVerification] = None
    rcAdvancedVerification: Optional[RcAdvancedVerification] = None
    rcChallanVerification: Optional[RcChallanVerification] = None
    uanVerification: Optional[UanVerification] = None
    employmentHistoryVerification: Optional[EmploymentHistoryVerification] = None
    mobileToPANVerification: Optional[MobileToPANVerification] = None
    createdAt: datetime
    updatedAt: datetime
