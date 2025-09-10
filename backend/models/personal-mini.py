#need to be veri    fied

from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List, Literal
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
    if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", v):
        raise ValueError("Invalid PAN number")
    return v

def mobile_validator(v: str) -> str:
    import re
    if not re.match(r"^[6-9]\\d{9}$", v):
        raise ValueError("Invalid mobile number")
    return v

def aadhaar_validator(v: str) -> str:
    import re
    if not re.match(r"^\\d{12}$", v):
        raise ValueError("Invalid Aadhaar number")
    return v

# Nested Models
class PersonalInfo(BaseModel):
    name: str
    dob: str
    mobile: str
    aadhaar: Optional[str]
    pan: Optional[str]
    dl: Optional[str]
    rcNumber: Optional[str]
    uanNumber: Optional[str]

    _validate_mobile = validator('mobile', allow_reuse=True)(mobile_validator)
    _validate_aadhaar = validator('aadhaar', allow_reuse=True)(aadhaar_validator)
    _validate_pan = validator('pan', allow_reuse=True)(pan_validator)

class AadhaarVerification(BaseModel):
    aadhaarNumber: str
    ageRange: Optional[str]
    state: Optional[str]
    gender: Optional[Gender]
    lastDigits: Optional[str]
    isMobile: Optional[bool]
    verificationStatus: VerificationStatus
    verifiedAt: datetime

    _validate_aadhaar = validator('aadhaarNumber', allow_reuse=True)(aadhaar_validator)

class PanVerification(BaseModel):
    panNumber: str
    fullName: Optional[str]
    status: Optional[str]
    category: Optional[str]
    cleanedName: Optional[str]
    verificationStatus: VerificationStatus
    verifiedAt: datetime

    _validate_pan = validator('panNumber', allow_reuse=True)(pan_validator)

class DlCovDetail(BaseModel):
    cov: Optional[str]
    issueDate: Optional[str]
    category: Optional[str]

class DlVerification(BaseModel):
    dlNumber: str
    name: Optional[str]
    relativeName: Optional[str]
    address: Optional[str]
    issuingRto: Optional[str]
    dateOfIssue: Optional[str]
    validFrom: Optional[str]
    validTo: Optional[str]
    covDetails: Optional[List[DlCovDetail]]
    verificationStatus: VerificationStatus
    verifiedAt: datetime
    requestId: Optional[str]

class RcAdvancedVerification(BaseModel):
    rcNumber: str
    registrationDate: Optional[str]
    ownerName: Optional[str]
    fatherName: Optional[str]
    presentAddress: Optional[str]
    permanentAddress: Optional[str]
    vehicleCategory: Optional[str]
    vehicleChasiNumber: Optional[str]
    vehicleEngineNumber: Optional[str]
    makerDescription: Optional[str]
    makerModel: Optional[str]
    bodyType: Optional[str]
    fuelType: Optional[str]
    color: Optional[str]
    normsType: Optional[str]
    fitUpTo: Optional[str]
    financer: Optional[str]
    financed: Optional[bool]
    insuranceCompany: Optional[str]
    insurancePolicyNumber: Optional[str]
    insuranceUpto: Optional[str]
    manufacturingDate: Optional[str]
    registeredAt: Optional[str]
    cubicCapacity: Optional[str]
    seatingCapacity: Optional[str]
    rcStatus: Optional[str]
    verificationStatus: VerificationStatus
    verifiedAt: datetime

class RcChallanDetail(BaseModel):
    challanNumber: str
    offenseDetails: str
    challanPlace: Optional[str]
    challanDate: str
    amount: float
    challanStatus: str
    accusedName: Optional[str]

class RcChallanVerification(BaseModel):
    rcNumber: str
    totalChallans: Optional[int]
    totalAmount: Optional[float]
    latestChallanDate: Optional[str]
    challanDetails: Optional[List[RcChallanDetail]]
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
    guardianName: Optional[str]
    establishmentName: str
    memberId: Optional[str]
    dateOfJoining: str
    dateOfExit: Optional[str]
    lastPfSubmitted: Optional[str]

class EmploymentHistoryVerification(BaseModel):
    uanNumber: str
    employmentHistory: Optional[List[EmploymentHistoryDetail]]
    verificationStatus: VerificationStatus
    verifiedAt: datetime

class MobileToPANVerification(BaseModel):
    mobileNumber: str
    panNumber: Optional[str]
    fullName: Optional[str]
    fullNameSplit: Optional[List[str]]
    maskedAadhaar: Optional[str]
    gender: Optional[Gender]
    dob: Optional[str]
    aadhaarLinked: Optional[bool]
    dobVerified: Optional[bool]
    category: Optional[str]
    verificationStatus: VerificationStatus
    verifiedAt: datetime

    _validate_mobile = validator('mobileNumber', allow_reuse=True)(mobile_validator)
    _validate_pan = validator('panNumber', allow_reuse=True)(pan_validator)

# Main Model
class MiniProfile(BaseModel):
    personalInfo: PersonalInfo
    aadhaarVerification: Optional[AadhaarVerification]
    panVerification: Optional[PanVerification]
    dlVerification: Optional[DlVerification]
    rcAdvancedVerification: Optional[RcAdvancedVerification]
    rcChallanVerification: Optional[RcChallanVerification]
    uanVerification: Optional[UanVerification]
    employmentHistoryVerification: Optional[EmploymentHistoryVerification]
    mobileToPANVerification: Optional[MobileToPANVerification]
    createdAt: datetime
    updatedAt: datetime