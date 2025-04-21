# schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal
from datetime import date, datetime
from models import UserType, FarmStatusEnum


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


# Inventory Schemas
class InventoryBase(BaseModel):
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: float
    govt_documentation: Optional[str] = None


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: Optional[float] = None
    govt_documentation: Optional[str] = None


class InventoryResponse(InventoryBase):
    id: int
    trader_id: int
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Inventory Image Schemas
class InventoryImageBase(BaseModel):
    inventory_id: int
    image_url: str


class InventoryImageCreate(InventoryImageBase):
    pass


class InventoryImageResponse(InventoryImageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryWithImagesResponse(InventoryResponse):
    images: List[InventoryImageResponse] = []


# Commodity Schemas
class CommodityBase(BaseModel):
    name: str
    quantity_available: float
    price_per_unit: float
    harvested_date: Optional[date] = None
    testing_score: Optional[float] = None
    tested_by_platform: bool = False
    additional_info: Optional[str] = None


class CommodityCreate(CommodityBase):
    pass


class CommodityUpdate(BaseModel):
    name: Optional[str] = None
    quantity_available: Optional[float] = None
    price_per_unit: Optional[float] = None
    harvested_date: Optional[date] = None
    testing_score: Optional[float] = None
    tested_by_platform: Optional[bool] = None
    additional_info: Optional[str] = None


class CommodityResponse(CommodityBase):
    id: int
    inventory_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InventoryWithCommoditiesResponse(InventoryWithImagesResponse):
    commodities: List[CommodityResponse] = []


# Requirement Schemas
class RequirementBase(BaseModel):
    commodity_type: str
    quantity_required: float
    delivery_location: Optional[str] = None
    delivery_lat: Optional[float] = None
    delivery_long: Optional[float] = None
    expected_price_min: Optional[float] = None
    expected_price_max: Optional[float] = None
    requirement_type: str  # 'current' or 'future'
    delivery_window_start: date
    delivery_window_end: date
    description: Optional[str] = None


class RequirementCreate(RequirementBase):
    pass


class RequirementUpdate(BaseModel):
    commodity_type: Optional[str] = None
    quantity_required: Optional[float] = None
    delivery_location: Optional[str] = None
    delivery_lat: Optional[float] = None
    delivery_long: Optional[float] = None
    expected_price_min: Optional[float] = None
    expected_price_max: Optional[float] = None
    requirement_type: Optional[str] = None
    delivery_window_start: Optional[date] = None
    delivery_window_end: Optional[date] = None
    description: Optional[str] = None
    status: Optional[str] = None


class RequirementResponse(RequirementBase):
    id: int
    company_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    company: Optional[CompanyProfileResponse] = None

    class Config:
        from_attributes = True


class RequirementBasicInfo(BaseModel):
    id: int
    commodity_type: str
    company: Optional[CompanyProfileResponse] = None

    class Config:
        from_attributes = True


# TraderApplication Schemas
class TraderApplicationBase(BaseModel):
    requirement_id: int
    trader_id: int
    inventory_id: int
    proposed_quantity: float
    proposed_price: float
    eta: date
    message: Optional[str] = None


class TraderApplicationCreate(BaseModel):
    requirement_id: int
    inventory_id: int
    proposed_quantity: float
    proposed_price: float
    eta: date
    message: Optional[str] = None


class TraderApplicationUpdate(BaseModel):
    status: str


class TraderApplicationResponse(TraderApplicationBase):
    id: int
    status: str
    created_at: datetime
    requirement: Optional[RequirementBasicInfo] = None

    class Config:
        from_attributes = True


class TraderApplicationDetailResponse(TraderApplicationResponse):
    trader_name: Optional[str] = None
    trader_rating: Optional[float] = None
    inventory_location: Optional[str] = None
    
    class Config:
        from_attributes = True


# Deal Schemas
class DealBase(BaseModel):
    company_id: int
    trader_id: int
    inventory_id: int
    requirement_id: Optional[int] = None
    commodity_type: str
    quantity: float
    price: float
    eta: date


class DealCreate(BaseModel):
    trader_id: int
    inventory_id: int
    requirement_id: Optional[int] = None
    commodity_type: str
    quantity: float
    price: float
    eta: date


class DealUpdate(BaseModel):
    status: str


class DealResponse(DealBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DealDetailResponse(DealResponse):
    trader_name: Optional[str] = None
    company_name: Optional[str] = None
    inventory_location: Optional[str] = None
    
    class Config:
        from_attributes = True