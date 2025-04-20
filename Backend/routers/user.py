from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from auth.auth_handler import get_current_active_user
from database import get_db
from schemas import FarmerResponse, CompanyResponse, TraderResponse
from models import User, UserType

router = APIRouter()

@router.get("/users/me/", response_model=FarmerResponse | CompanyResponse | TraderResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get current user profile with type-specific information"""
    user = current_user
    
    # Load the appropriate profile based on user type
    if user.user_type == UserType.FARMER:
        if not user.farmer_profile:
            raise HTTPException(status_code=404, detail="Farmer profile not found")
        
        return FarmerResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            mobile_number=user.mobile_number,
            user_type=user.user_type,
            is_active=user.is_active,
            profile={
                "id": user.farmer_profile.id,
                "user_id": user.farmer_profile.user_id,
                "farm_location": user.farmer_profile.farm_location,
                "farm_area": user.farmer_profile.farm_area,
                "government_id": user.farmer_profile.government_id
            }
        )
    elif user.user_type == UserType.COMPANY:
        if not user.company_profile:
            raise HTTPException(status_code=404, detail="Company profile not found")
        
        return CompanyResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            mobile_number=user.mobile_number,
            user_type=user.user_type,
            is_active=user.is_active,
            profile={
                "id": user.company_profile.id,
                "user_id": user.company_profile.user_id,
                "company_name": user.company_profile.company_name,
                "company_type": user.company_profile.company_type,
                "company_location": user.company_profile.company_location,
                "contact_person_designation": user.company_profile.contact_person_designation,
                "company_gst_id": user.company_profile.company_gst_id
            }
        )
    elif user.user_type == UserType.TRADER:
        if not user.trader_profile:
            raise HTTPException(status_code=404, detail="Trader profile not found")
        
        return TraderResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            mobile_number=user.mobile_number,
            user_type=user.user_type,
            is_active=user.is_active,
            profile={
                "id": user.trader_profile.id,
                "user_id": user.trader_profile.user_id,
                "address": user.trader_profile.address,
                "gst_number": user.trader_profile.gst_number,
                "government_id": user.trader_profile.government_id,
                "logistics_capability": user.trader_profile.logistics_capability,
                "storage_capacity_tons": user.trader_profile.storage_capacity_tons,
                "commodities_dealt": json.loads(user.trader_profile.commodities_dealt)
            }
        )
    
    # This should not happen if user_type is properly set
    raise HTTPException(status_code=500, detail="Invalid user type")
