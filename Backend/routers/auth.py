from datetime import timedelta

from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session
import json

from auth.auth_handler import authenticate_user, ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, get_user, get_password_hash
from database import get_db
from schemas import Token, FarmerCreate, CompanyCreate, TraderCreate, FarmerResponse, CompanyResponse, TraderResponse
from models import User, UserType, Farmer, Company, Trader

router = APIRouter()


@router.post("/register/farmer", response_model=FarmerResponse)
def register_farmer(user_data: FarmerCreate, db: Session = Depends(get_db)):
    db_user = get_user(db, user_data.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered.")
    
    # Create base user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        user_type=UserType.FARMER,
        full_name=user_data.full_name,
        mobile_number=user_data.mobile_number
    )
    db.add(db_user)
    db.flush()  # Flush to get the ID without committing
    
    # Create farmer profile
    db_farmer = Farmer(
        user_id=db_user.id,
        farm_location=user_data.profile.farm_location,
        farm_area=user_data.profile.farm_area,
        government_id=user_data.profile.government_id
    )
    db.add(db_farmer)
    db.commit()
    db.refresh(db_user)
    
    # Construct response
    response = FarmerResponse(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        full_name=db_user.full_name,
        mobile_number=db_user.mobile_number,
        user_type=db_user.user_type,
        is_active=db_user.is_active,
        profile={
            "id": db_farmer.id,
            "user_id": db_farmer.user_id,
            "farm_location": db_farmer.farm_location,
            "farm_area": db_farmer.farm_area,
            "government_id": db_farmer.government_id
        }
    )
    return response


@router.post("/register/company", response_model=CompanyResponse)
def register_company(user_data: CompanyCreate, db: Session = Depends(get_db)):
    db_user = get_user(db, user_data.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered.")
    
    # Create base user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        user_type=UserType.COMPANY,
        full_name=user_data.full_name,
        mobile_number=user_data.mobile_number
    )
    db.add(db_user)
    db.flush()  # Flush to get the ID without committing
    
    # Create company profile
    db_company = Company(
        user_id=db_user.id,
        company_name=user_data.profile.company_name,
        company_type=user_data.profile.company_type,
        company_location=user_data.profile.company_location,
        contact_person_designation=user_data.profile.contact_person_designation,
        company_gst_id=user_data.profile.company_gst_id
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_user)
    
    # Construct response
    response = CompanyResponse(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        full_name=db_user.full_name,
        mobile_number=db_user.mobile_number,
        user_type=db_user.user_type,
        is_active=db_user.is_active,
        profile={
            "id": db_company.id,
            "user_id": db_company.user_id,
            "company_name": db_company.company_name,
            "company_type": db_company.company_type,
            "company_location": db_company.company_location,
            "contact_person_designation": db_company.contact_person_designation,
            "company_gst_id": db_company.company_gst_id
        }
    )
    return response


@router.post("/register/trader", response_model=TraderResponse)
def register_trader(user_data: TraderCreate, db: Session = Depends(get_db)):
    db_user = get_user(db, user_data.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered.")
    
    # Create base user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        user_type=UserType.TRADER,
        full_name=user_data.full_name,
        mobile_number=user_data.mobile_number
    )
    db.add(db_user)
    db.flush()  # Flush to get the ID without committing
    
    # Create trader profile
    db_trader = Trader(
        user_id=db_user.id,
        address=user_data.profile.address,
        gst_number=user_data.profile.gst_number,
        government_id=user_data.profile.government_id,
        logistics_capability=user_data.profile.logistics_capability,
        storage_capacity_tons=user_data.profile.storage_capacity_tons,
        commodities_dealt=json.dumps(user_data.profile.commodities_dealt)
    )
    db.add(db_trader)
    db.commit()
    db.refresh(db_user)
    
    # Construct response
    response = TraderResponse(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        full_name=db_user.full_name,
        mobile_number=db_user.mobile_number,
        user_type=db_user.user_type,
        is_active=db_user.is_active,
        profile={
            "id": db_trader.id,
            "user_id": db_trader.user_id,
            "address": db_trader.address,
            "gst_number": db_trader.gst_number,
            "government_id": db_trader.government_id,
            "logistics_capability": db_trader.logistics_capability,
            "storage_capacity_tons": db_trader.storage_capacity_tons,
            "commodities_dealt": json.loads(db_trader.commodities_dealt)
        }
    )
    return response


@router.post("/token")
async def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
) -> Token:
    user = authenticate_user(db, form_data.username, form_data.password)  
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")
