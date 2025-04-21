from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import date
import logging # Import logging

from database import get_db
from models import (
    User, Company, Trader, Inventory, 
    Requirement, RequirementStatusEnum,
    TraderApplication, TraderApplicationStatusEnum,
    Deal, DealStatusEnum, UserType
)
from schemas import (
    RequirementCreate, RequirementResponse, RequirementUpdate,
    TraderApplicationCreate, TraderApplicationResponse, TraderApplicationDetailResponse, TraderApplicationUpdate,
    DealCreate, DealResponse, DealDetailResponse, DealUpdate
)
from auth.auth_handler import get_current_active_user

router = APIRouter(prefix="/api", tags=["requirements"])

# Create a new requirement
@router.post("/requirements/", response_model=RequirementResponse, status_code=status.HTTP_201_CREATED)
async def create_requirement(
    requirement: RequirementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is a company
    if current_user.user_type != UserType.COMPANY:
        raise HTTPException(status_code=403, detail="Only companies can create requirements")
    
    # Get the company profile ID
    if not current_user.company_profile:
        raise HTTPException(status_code=400, detail="Company profile not found")
    
    # Create new requirement
    db_requirement = Requirement(
        **requirement.dict(),
        company_id=current_user.company_profile.id
    )
    
    db.add(db_requirement)
    db.commit()
    db.refresh(db_requirement)
    return db_requirement

# Get all requirements for a company
@router.get("/requirements/company/", response_model=List[RequirementResponse])
async def get_company_requirements(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is a company
    if current_user.user_type != UserType.COMPANY:
        raise HTTPException(status_code=403, detail="Access restricted to companies")
    
    # Get the company profile ID
    if not current_user.company_profile:
        raise HTTPException(status_code=400, detail="Company profile not found")
    
    query = db.query(Requirement).filter(Requirement.company_id == current_user.company_profile.id)
    
    # Filter by status if provided
    if status:
        query = query.filter(Requirement.status == status)
    
    requirements = query.order_by(Requirement.created_at.desc()).offset(skip).limit(limit).all()
    return requirements

# Get all available requirements for traders
@router.get("/requirements/available/", response_model=List[RequirementResponse])
async def get_available_requirements(
    commodity_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Eagerly load the related company data
    query = db.query(Requirement).options(joinedload(Requirement.company)).filter(Requirement.status == RequirementStatusEnum.OPEN)
    
    # Filter by commodity_type if provided
    if commodity_type:
        query = query.filter(Requirement.commodity_type == commodity_type)
    
    requirements = query.order_by(Requirement.created_at.desc()).offset(skip).limit(limit).all()
    
    # Now the Requirement objects will have the company attribute populated
    return requirements

# Get a specific requirement by ID
@router.get("/requirements/{requirement_id}", response_model=RequirementResponse)
async def get_requirement(
    requirement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    logging.info(f"Fetching requirement ID: {requirement_id}") # Log entry
    requirement = db.query(Requirement).options(
        joinedload(Requirement.company)
    ).filter(Requirement.id == requirement_id).first()
    
    if not requirement:
        logging.warning(f"Requirement ID: {requirement_id} not found.") # Log warning
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # Log the fetched requirement and its company attribute
    logging.info(f"Requirement found: {requirement.id}")
    if requirement.company:
        logging.info(f"  Company attached: ID={requirement.company.id}, Name='{requirement.company.company_name}'")
    else:
        logging.warning(f"  Company relationship NOT loaded or is None for Requirement ID: {requirement.id}")

    # Check permissions
    if current_user.user_type == UserType.COMPANY:
        if not current_user.company_profile or current_user.company_profile.id != requirement.company_id:
             logging.warning(f"Permission denied for user {current_user.id} to view requirement {requirement.id}") # Log denial
             raise HTTPException(status_code=403, detail="You don't have permission to view this requirement")
    
    logging.info(f"Returning requirement {requirement.id} data.") # Log exit
    return requirement

# Update a requirement
@router.patch("/requirements/{requirement_id}", response_model=RequirementResponse)
async def update_requirement(
    requirement_id: int,
    requirement_update: RequirementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is a company
    if current_user.user_type != UserType.COMPANY:
        raise HTTPException(status_code=403, detail="Only companies can update requirements")
    
    # Get the requirement
    db_requirement = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not db_requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # Check if current user is the company that created the requirement
    if current_user.company_profile.id != db_requirement.company_id:
        raise HTTPException(status_code=403, detail="You don't have permission to update this requirement")
    
    # Update requirement fields
    update_data = requirement_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_requirement, key, value)
    
    db.commit()
    db.refresh(db_requirement)
    return db_requirement

# Delete a requirement
@router.delete("/requirements/{requirement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_requirement(
    requirement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is a company
    if current_user.user_type != UserType.COMPANY:
        raise HTTPException(status_code=403, detail="Only companies can delete requirements")
    
    # Get the requirement
    db_requirement = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not db_requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # Check if current user is the company that created the requirement
    if current_user.company_profile.id != db_requirement.company_id:
        raise HTTPException(status_code=403, detail="You don't have permission to delete this requirement")
    
    # Check if there are any deals in progress
    deals = db.query(Deal).filter(
        Deal.requirement_id == requirement_id,
        Deal.status.in_([DealStatusEnum.IN_DISCUSSION, DealStatusEnum.CONFIRMED])
    ).all()
    
    if deals:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete this requirement as there are deals in progress. Please cancel all deals first."
        )
    
    # Delete associated applications first (due to foreign key constraints)
    db.query(TraderApplication).filter(TraderApplication.requirement_id == requirement_id).delete()
    
    # Set requirement_id to NULL in completed deals
    db.query(Deal).filter(
        Deal.requirement_id == requirement_id,
        Deal.status == DealStatusEnum.COMPLETED
    ).update({Deal.requirement_id: None})
    
    # Delete the requirement
    db.delete(db_requirement)
    db.commit()
    
    return None

# Create a trader application for a requirement
@router.post("/applications/", response_model=TraderApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    application: TraderApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is a trader
    if current_user.user_type != UserType.TRADER:
        raise HTTPException(status_code=403, detail="Only traders can create applications")
    
    # Get the trader profile ID
    if not current_user.trader_profile:
        raise HTTPException(status_code=400, detail="Trader profile not found")
    
    # Check if requirement exists and is open
    requirement = db.query(Requirement).filter(Requirement.id == application.requirement_id).first()
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    if requirement.status != RequirementStatusEnum.OPEN:
        raise HTTPException(status_code=400, detail="This requirement is no longer open for applications")
    
    # Check if inventory belongs to trader
    inventory = db.query(Inventory).filter(
        Inventory.id == application.inventory_id,
        Inventory.trader_id == current_user.trader_profile.id
    ).first()
    
    if not inventory:
        raise HTTPException(status_code=403, detail="You don't have permission to use this inventory")
    
    # Check if trader has already applied to this requirement
    existing_application = db.query(TraderApplication).filter(
        TraderApplication.requirement_id == application.requirement_id,
        TraderApplication.trader_id == current_user.trader_profile.id
    ).first()
    
    if existing_application:
        raise HTTPException(status_code=400, detail="You have already applied to this requirement")
    
    # Create new application
    db_application = TraderApplication(
        **application.dict(),
        trader_id=current_user.trader_profile.id
    )
    
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application

# Get applications for a requirement (company view)
@router.get("/applications/requirement/{requirement_id}", response_model=List[TraderApplicationDetailResponse])
async def get_requirement_applications(
    requirement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is a company
    if current_user.user_type != UserType.COMPANY:
        raise HTTPException(status_code=403, detail="Access restricted to companies")
    
    # Check if requirement exists and belongs to company
    requirement = db.query(Requirement).filter(
        Requirement.id == requirement_id,
        Requirement.company_id == current_user.company_profile.id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found or you don't have permission")
    
    # Get applications with additional info
    applications = db.query(
        TraderApplication,
        User.full_name.label("trader_name"),
        Inventory.location_name.label("inventory_location")
    ).join(
        Trader, TraderApplication.trader_id == Trader.id
    ).join(
        User, Trader.user_id == User.id
    ).join(
        Inventory, TraderApplication.inventory_id == Inventory.id
    ).filter(
        TraderApplication.requirement_id == requirement_id
    ).all()
    
    # Format the result
    result = []
    for app, trader_name, inventory_location in applications:
        app_dict = {
            **{c.name: getattr(app, c.name) for c in app.__table__.columns},
            "trader_name": trader_name,
            "inventory_location": inventory_location,
            # Add dummy rating for now - in a real app, this would come from a rating system
            "trader_rating": 4.5
        }
        result.append(app_dict)
    
    return result

# Get applications by trader
@router.get("/applications/trader/", response_model=List[TraderApplicationResponse])
async def get_trader_applications(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is a trader
    if current_user.user_type != UserType.TRADER:
        raise HTTPException(status_code=403, detail="Access restricted to traders")
    
    # Eagerly load Requirement and nested Company data
    query = db.query(TraderApplication).options(
        joinedload(TraderApplication.requirement).options(
            joinedload(Requirement.company)
        )
    ).filter(TraderApplication.trader_id == current_user.trader_profile.id)
    
    # Filter by status if provided
    if status:
        query = query.filter(TraderApplication.status == status)
    
    applications = query.order_by(TraderApplication.created_at.desc()).all()
    # Now includes nested requirement and company info
    return applications

# Update application status (company accepts/rejects)
@router.patch("/applications/{application_id}", response_model=TraderApplicationResponse)
async def update_application_status(
    application_id: int,
    status_update: TraderApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is a company
    if current_user.user_type != UserType.COMPANY:
        raise HTTPException(status_code=403, detail="Only companies can update application status")
    
    # Get the application
    application = db.query(TraderApplication).filter(TraderApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Check if requirement belongs to the company
    requirement = db.query(Requirement).filter(
        Requirement.id == application.requirement_id,
        Requirement.company_id == current_user.company_profile.id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=403, detail="You don't have permission to update this application")
    
    # Update application status
    application.status = status_update.status
    
    # If accepted, also update requirement status and create a deal
    if status_update.status == TraderApplicationStatusEnum.ACCEPTED:
        # Update requirement status
        requirement.status = RequirementStatusEnum.IN_DISCUSSION
        
        # Create a new deal
        new_deal = Deal(
            company_id=current_user.company_profile.id,
            trader_id=application.trader_id,
            inventory_id=application.inventory_id,
            requirement_id=requirement.id,
            commodity_type=requirement.commodity_type,
            quantity=application.proposed_quantity,
            price=application.proposed_price,
            eta=application.eta,
            status=DealStatusEnum.IN_DISCUSSION
        )
        
        db.add(new_deal)
    
    db.commit()
    db.refresh(application)
    return application

# Create a direct deal (company initiates with trader)
@router.post("/deals/", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
async def create_deal(
    deal: DealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is a company
    if current_user.user_type != UserType.COMPANY:
        raise HTTPException(status_code=403, detail="Only companies can create direct deals")
    
    # Get the company profile ID
    if not current_user.company_profile:
        raise HTTPException(status_code=400, detail="Company profile not found")
    
    # Create new deal
    db_deal = Deal(
        **deal.dict(),
        company_id=current_user.company_profile.id,
        status=DealStatusEnum.IN_DISCUSSION
    )
    
    db.add(db_deal)
    db.commit()
    db.refresh(db_deal)
    return db_deal

# Get deals for a company
@router.get("/deals/company/", response_model=List[DealDetailResponse])
async def get_company_deals(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is a company
    if current_user.user_type != UserType.COMPANY:
        raise HTTPException(status_code=403, detail="Access restricted to companies")
    
    # Query deals with joined data
    deals = db.query(
        Deal,
        User.full_name.label("trader_name"),
        Inventory.location_name.label("inventory_location")
    ).join(
        Trader, Deal.trader_id == Trader.id
    ).join(
        User, Trader.user_id == User.id
    ).join(
        Inventory, Deal.inventory_id == Inventory.id
    ).filter(
        Deal.company_id == current_user.company_profile.id
    )
    
    # Filter by status if provided
    if status:
        deals = deals.filter(Deal.status == status)
    
    deals = deals.order_by(Deal.created_at.desc()).all()
    
    # Format the result
    result = []
    for deal, trader_name, inventory_location in deals:
        deal_dict = {
            **{c.name: getattr(deal, c.name) for c in deal.__table__.columns},
            "trader_name": trader_name,
            "inventory_location": inventory_location
        }
        result.append(deal_dict)
    
    return result

# Get deals for a trader
@router.get("/deals/trader/", response_model=List[DealDetailResponse])
async def get_trader_deals(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is a trader
    if current_user.user_type != UserType.TRADER:
        raise HTTPException(status_code=403, detail="Access restricted to traders")
    
    # Query deals with joined data
    deals = db.query(
        Deal,
        User.full_name.label("company_name"),
        Inventory.location_name.label("inventory_location")
    ).join(
        Company, Deal.company_id == Company.id
    ).join(
        User, Company.user_id == User.id
    ).join(
        Inventory, Deal.inventory_id == Inventory.id
    ).filter(
        Deal.trader_id == current_user.trader_profile.id
    )
    
    # Filter by status if provided
    if status:
        deals = deals.filter(Deal.status == status)
    
    deals = deals.order_by(Deal.created_at.desc()).all()
    
    # Format the result
    result = []
    for deal, company_name, inventory_location in deals:
        deal_dict = {
            **{c.name: getattr(deal, c.name) for c in deal.__table__.columns},
            "company_name": company_name,
            "inventory_location": inventory_location
        }
        result.append(deal_dict)
    
    return result

# Update deal status
@router.patch("/deals/{deal_id}", response_model=DealResponse)
async def update_deal_status(
    deal_id: int,
    status_update: DealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get the deal
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Check permissions (either company or trader involved in the deal)
    is_company = current_user.user_type == UserType.COMPANY and current_user.company_profile.id == deal.company_id
    is_trader = current_user.user_type == UserType.TRADER and current_user.trader_profile.id == deal.trader_id
    
    if not (is_company or is_trader):
        raise HTTPException(status_code=403, detail="You don't have permission to update this deal")
    
    # Update deal status
    deal.status = status_update.status
    
    # If marked as COMPLETED and there's an associated requirement, update its status
    if status_update.status == DealStatusEnum.COMPLETED and deal.requirement_id:
        requirement = db.query(Requirement).filter(Requirement.id == deal.requirement_id).first()
        if requirement:
            requirement.status = RequirementStatusEnum.FULFILLED
    
    db.commit()
    db.refresh(deal)
    return deal 