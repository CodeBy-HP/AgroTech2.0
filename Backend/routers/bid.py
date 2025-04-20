from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func

from database import get_db
from models import User, Farm, Bid, UserType, BidStatusEnum
from schemas import BidCreate, BidResponse, BidUpdate, BidWithFarmResponse
from auth.auth_handler import get_current_active_user

router = APIRouter(prefix="/api", tags=["bids"])

# Create a new bid (only for traders)
@router.post("/bids/", response_model=BidResponse)
async def create_bid(
    bid: BidCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is a trader
    if current_user.user_type != UserType.TRADER:
        raise HTTPException(status_code=403, detail="Only traders can place bids")
    
    # Check if trader profile exists
    if not current_user.trader_profile:
        raise HTTPException(status_code=400, detail="Trader profile not found")
    
    # Check if farm exists
    farm = db.query(Farm).filter(Farm.id == bid.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    # Check if trader already has a pending bid for this farm
    existing_bid = db.query(Bid).filter(
        Bid.farm_id == bid.farm_id,
        Bid.trader_id == current_user.trader_profile.id,
        Bid.status == BidStatusEnum.PENDING
    ).first()
    
    if existing_bid:
        raise HTTPException(status_code=400, detail="You already have a pending bid for this farm")
    
    # Create new bid
    db_bid = Bid(
        farm_id=bid.farm_id,
        trader_id=current_user.trader_profile.id,
        bid_amount=bid.bid_amount,
        status=BidStatusEnum.PENDING
    )
    
    db.add(db_bid)
    db.commit()
    db.refresh(db_bid)
    
    return db_bid

# Get all bids with optional farm_id filter
@router.get("/bids/", response_model=List[BidResponse])
async def get_bids(
    farm_id: Optional[int] = None,
    status: Optional[BidStatusEnum] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Bid)
    
    # Traders can only see their own bids
    if current_user.user_type == UserType.TRADER:
        if not current_user.trader_profile:
            raise HTTPException(status_code=400, detail="Trader profile not found")
        query = query.filter(Bid.trader_id == current_user.trader_profile.id)
    
    # Farmers can only see bids for their farms
    elif current_user.user_type == UserType.FARMER:
        if not current_user.farmer_profile:
            raise HTTPException(status_code=400, detail="Farmer profile not found")
        # Get all farms owned by the farmer
        farmer_farms = db.query(Farm.id).filter(Farm.farmer_id == current_user.farmer_profile.id).all()
        farmer_farm_ids = [farm[0] for farm in farmer_farms]
        query = query.filter(Bid.farm_id.in_(farmer_farm_ids))
    
    # Apply additional filters if provided
    if farm_id:
        query = query.filter(Bid.farm_id == farm_id)
    
    if status:
        query = query.filter(Bid.status == status)
    
    # Execute query with pagination
    bids = query.offset(skip).limit(limit).all()
    return bids

# Get a specific bid
@router.get("/bids/{bid_id}", response_model=BidWithFarmResponse)
async def get_bid(
    bid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get bid
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    # Check permissions
    farm = db.query(Farm).filter(Farm.id == bid.farm_id).first()
    
    # Only the bid maker (trader) or farm owner (farmer) can see a specific bid
    if (current_user.user_type == UserType.TRADER and 
        current_user.trader_profile and 
        current_user.trader_profile.id == bid.trader_id) or \
       (current_user.user_type == UserType.FARMER and 
        current_user.farmer_profile and 
        current_user.farmer_profile.id == farm.farmer_id):
        return bid
    else:
        raise HTTPException(status_code=403, detail="You don't have permission to view this bid")

# Update a bid
@router.put("/bids/{bid_id}", response_model=BidResponse)
async def update_bid(
    bid_id: int,
    bid_update: BidUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get bid
    db_bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not db_bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    # Get farm
    farm = db.query(Farm).filter(Farm.id == db_bid.farm_id).first()
    
    # Check permissions based on update type
    if bid_update.bid_amount is not None:
        # Only the bid maker (trader) can update the bid amount
        if not current_user.trader_profile or current_user.trader_profile.id != db_bid.trader_id:
            raise HTTPException(status_code=403, detail="Only the trader that made the bid can update the amount")
        
        # Can only update if bid is still pending
        if db_bid.status != BidStatusEnum.PENDING:
            raise HTTPException(status_code=400, detail="Cannot update the amount of a non-pending bid")
        
        # Update bid amount
        db_bid.bid_amount = bid_update.bid_amount
    
    if bid_update.status is not None:
        # Only the farm owner (farmer) can update the bid status
        if not current_user.farmer_profile or current_user.farmer_profile.id != farm.farmer_id:
            raise HTTPException(status_code=403, detail="Only the farm owner can update the bid status")
        
        # Update bid status
        db_bid.status = bid_update.status
    
    db.commit()
    db.refresh(db_bid)
    return db_bid

# Delete a bid (only for the bid maker and only if pending)
@router.delete("/bids/{bid_id}", status_code=204)
async def delete_bid(
    bid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get bid
    db_bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not db_bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    # Check if current user is the bid maker
    if not current_user.trader_profile or current_user.trader_profile.id != db_bid.trader_id:
        raise HTTPException(status_code=403, detail="Only the trader that made the bid can delete it")
    
    # Check if bid is still pending
    if db_bid.status != BidStatusEnum.PENDING:
        raise HTTPException(status_code=400, detail="Cannot delete a non-pending bid")
    
    # Delete bid
    db.delete(db_bid)
    db.commit()
    return None

# Get all bids made by the current trader
@router.get("/bids/my-bids/", response_model=List[BidResponse])
async def get_my_bids(
    status: Optional[BidStatusEnum] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.user_type != UserType.TRADER:
        raise HTTPException(status_code=403, detail="Only traders can access this endpoint")
    
    if not current_user.trader_profile:
        raise HTTPException(status_code=400, detail="Trader profile not found")
    
    query = db.query(Bid).filter(Bid.trader_id == current_user.trader_profile.id)
    
    if status:
        query = query.filter(Bid.status == status)
    
    bids = query.all()
    return bids 