# schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal
from datetime import date, datetime
from models import UserType, FarmStatusEnum, BidStatusEnum


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    mobile_number: str


class UserCreate(UserBase):
    password: str
    user_type: UserType


class FarmerProfileBase(BaseModel):
    farm_location: str
    farm_area: float
    government_id: Optional[str] = None


class FarmerProfileCreate(FarmerProfileBase):
    pass


class CompanyProfileBase(BaseModel):
    company_name: str
    company_type: str
    company_location: str
    contact_person_designation: str
    company_gst_id: Optional[str] = None


class CompanyProfileCreate(CompanyProfileBase):
    pass


class FarmerCreate(UserCreate):
    user_type: UserType = UserType.FARMER
    profile: FarmerProfileCreate


class CompanyCreate(UserCreate):
    user_type: UserType = UserType.COMPANY
    profile: CompanyProfileCreate


class FarmerProfileResponse(FarmerProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class CompanyProfileResponse(CompanyProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    id: int
    user_type: UserType
    is_active: bool

    class Config:
        from_attributes = True


class FarmerResponse(UserResponse):
    profile: Optional[FarmerProfileResponse] = None


class CompanyResponse(UserResponse):
    profile: Optional[CompanyProfileResponse] = None


class UserInDB(UserResponse):
    hashed_password: str


# Farm Schemas
class FarmBase(BaseModel):
    farm_location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    farm_area: float
    crop_type: Optional[str] = None
    is_organic: Optional[bool] = False
    pesticides_used: Optional[str] = None
    expected_harvest_date: Optional[date] = None
    expected_quantity: Optional[float] = None
    min_asking_price: Optional[float] = None
    farm_status: Optional[FarmStatusEnum] = FarmStatusEnum.EMPTY


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    farm_location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    farm_area: Optional[float] = None
    crop_type: Optional[str] = None
    is_organic: Optional[bool] = None
    pesticides_used: Optional[str] = None
    expected_harvest_date: Optional[date] = None
    expected_quantity: Optional[float] = None
    min_asking_price: Optional[float] = None
    farm_status: Optional[FarmStatusEnum] = None


class FarmResponse(FarmBase):
    id: int
    farmer_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Farm Image Schemas
class FarmImageBase(BaseModel):
    farm_id: int
    image_url: str


class FarmImageCreate(FarmImageBase):
    pass


class FarmImageResponse(FarmImageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Bid Schemas
class BidBase(BaseModel):
    farm_id: int
    bid_amount: float


class BidCreate(BidBase):
    pass


class BidUpdate(BaseModel):
    bid_amount: Optional[float] = None
    status: Optional[BidStatusEnum] = None


class BidResponse(BidBase):
    id: int
    trader_id: int
    bid_date: datetime
    status: BidStatusEnum
    updated_at: datetime

    class Config:
        from_attributes = True


# Additional response schemas
class FarmWithBidsResponse(FarmResponse):
    bids: List[BidResponse] = []


class BidWithFarmResponse(BidResponse):
    farm: FarmResponse


class FarmWithImagesResponse(FarmResponse):
    images: List[FarmImageResponse] = []


# Disease Identification Schemas
class TreatmentInfo(BaseModel):
    prevention: List[str] = []
    chemical: List[str] = []
    biological: List[str] = []


class DiseaseIdentificationResponse(BaseModel):
    name: str
    scientific_name: str
    probability: float
    treatment: TreatmentInfo


# Crop Health Record Schemas
class CropHealthRecordBase(BaseModel):
    user_id: int
    image_path: str
    detected_disease: Optional[str] = None
    scientific_name: Optional[str] = None
    confidence_score: Optional[float] = None
    notes: Optional[str] = None


class CropHealthRecordCreate(CropHealthRecordBase):
    pass


class CropHealthRecordResponse(CropHealthRecordBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True


# Government Schemes Schemas
class GovSchemeBase(BaseModel):
    scheme_name: str
    detailed_description: str
    type: str
    url: str


class GovSchemeCreate(GovSchemeBase):
    pass


class GovSchemeResponse(GovSchemeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TraderProfileBase(BaseModel):
    address: str
    gst_number: Optional[str] = None
    government_id: Optional[str] = None
    logistics_capability: bool = False
    storage_capacity_tons: Optional[float] = None
    commodities_dealt: List[
        Literal["grains", "pulses", "spices", "oil & oil seeds",
                "fruits & vegetables", "beverage & dry fruit", 
                "forest produce", "others"]
    ]


class TraderProfileCreate(TraderProfileBase):
    pass


class TraderCreate(UserCreate):
    user_type: UserType = UserType.TRADER
    profile: TraderProfileCreate


class TraderProfileResponse(TraderProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class TraderResponse(UserResponse):
    profile: Optional[TraderProfileResponse] = None