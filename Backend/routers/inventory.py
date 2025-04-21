from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import or_
import os
from fastapi.responses import JSONResponse

from database import get_db
from models import User, Inventory, InventoryImage, Commodity, UserType
from schemas import (
    InventoryCreate, 
    InventoryResponse, 
    InventoryUpdate, 
    InventoryImageResponse, 
    InventoryWithImagesResponse,
    CommodityCreate,
    CommodityResponse,
    CommodityUpdate,
    InventoryWithCommoditiesResponse
)
from auth.auth_handler import get_current_active_user
from utils import save_upload_file, delete_file, INVENTORY_IMAGES_DIR

router = APIRouter(prefix="/api", tags=["inventory"])

# Create a new inventory (only for traders)
@router.post("/inventories/", response_model=InventoryResponse)
async def create_inventory(
    inventory: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is a trader
    if current_user.user_type != UserType.TRADER:
        raise HTTPException(status_code=403, detail="Only traders can create inventory listings")
    
    # Get the trader profile ID
    if not current_user.trader_profile:
        raise HTTPException(status_code=400, detail="Trader profile not found")
    
    # Create new inventory
    db_inventory = Inventory(
        **inventory.dict(),
        trader_id=current_user.trader_profile.id
    )
    
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory

# Upload images for an inventory
@router.post("/inventories/{inventory_id}/images/", response_model=List[InventoryImageResponse])
async def upload_inventory_images(
    inventory_id: int,
    images: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if inventory exists
    db_inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Check if current user owns the inventory
    if not current_user.trader_profile or current_user.trader_profile.id != db_inventory.trader_id:
        raise HTTPException(status_code=403, detail="You don't have permission to upload images for this inventory")
    
    # Save images and create records
    saved_images = []
    for image in images:
        # Check if file is an image
        if not image.content_type.startswith("image/"):
            continue
        
        # Save image and get path
        image_path = await save_upload_file(image, INVENTORY_IMAGES_DIR)
        
        # If it's the first image, set it as the inventory's primary image
        if not db_inventory.image_url:
            db_inventory.image_url = image_path
            db.commit()
        
        # Create image record
        db_image = InventoryImage(
            inventory_id=inventory_id,
            image_url=image_path
        )
        
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        saved_images.append(db_image)
    
    return saved_images

# Get all images for an inventory
@router.get("/inventories/{inventory_id}/images/", response_model=List[InventoryImageResponse])
async def get_inventory_images(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if inventory exists
    db_inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Get all images for the inventory
    images = db.query(InventoryImage).filter(InventoryImage.inventory_id == inventory_id).all()
    return images

# Delete an inventory image
@router.delete("/inventories/images/{image_id}", status_code=204)
async def delete_inventory_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get the image
    db_image = db.query(InventoryImage).filter(InventoryImage.id == image_id).first()
    if not db_image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Get the inventory to check ownership
    db_inventory = db.query(Inventory).filter(Inventory.id == db_image.inventory_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Check if current user owns the inventory
    if not current_user.trader_profile or current_user.trader_profile.id != db_inventory.trader_id:
        raise HTTPException(status_code=403, detail="You don't have permission to delete this image")
    
    # Check if this is the primary image
    if db_inventory.image_url == db_image.image_url:
        # Find another image to be primary, or set to None
        other_image = db.query(InventoryImage).filter(
            InventoryImage.inventory_id == db_inventory.id,
            InventoryImage.id != image_id
        ).first()
        
        if other_image:
            db_inventory.image_url = other_image.image_url
        else:
            db_inventory.image_url = None
        
        db.commit()
    
    # Delete the file
    delete_file(db_image.image_url)
    
    # Delete the record
    db.delete(db_image)
    db.commit()
    
    return None

# Get all inventories with optional filters
@router.get("/inventories/", response_model=List[InventoryResponse])
async def get_inventories(
    location_name: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Inventory)
    
    # Apply filters if provided
    if location_name:
        query = query.filter(Inventory.location_name.contains(location_name))
    
    # Execute query with pagination
    inventories = query.offset(skip).limit(limit).all()
    return inventories

# Get a specific inventory by ID with its images and commodities
@router.get("/inventories/{inventory_id}", response_model=InventoryWithCommoditiesResponse)
async def get_inventory(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get inventory
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Get images for the inventory
    images = db.query(InventoryImage).filter(InventoryImage.inventory_id == inventory_id).all()
    
    # Get commodities in the inventory
    commodities = db.query(Commodity).filter(Commodity.inventory_id == inventory_id).all()
    
    # Convert inventory to dict and add images and commodities
    inventory_dict = {**inventory.__dict__}
    if "_sa_instance_state" in inventory_dict:
        inventory_dict.pop("_sa_instance_state")
    
    inventory_dict["images"] = images
    inventory_dict["commodities"] = commodities
    
    return inventory_dict

# Update an inventory (only for inventory owner)
@router.put("/inventories/{inventory_id}", response_model=InventoryResponse)
async def update_inventory(
    inventory_id: int,
    inventory_update: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if inventory exists
    db_inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Check if current user owns the inventory
    if not current_user.trader_profile or current_user.trader_profile.id != db_inventory.trader_id:
        raise HTTPException(status_code=403, detail="You don't have permission to update this inventory")
    
    # Update inventory fields
    update_data = inventory_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_inventory, key, value)
    
    db.commit()
    db.refresh(db_inventory)
    return db_inventory

# Delete an inventory (only for inventory owner)
@router.delete("/inventories/{inventory_id}", status_code=204)
async def delete_inventory(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if inventory exists
    db_inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Check if current user owns the inventory
    if not current_user.trader_profile or current_user.trader_profile.id != db_inventory.trader_id:
        raise HTTPException(status_code=403, detail="You don't have permission to delete this inventory")
    
    # Delete inventory images first
    inventory_images = db.query(InventoryImage).filter(InventoryImage.inventory_id == inventory_id).all()
    for image in inventory_images:
        delete_file(image.image_url)
        db.delete(image)
    
    # Delete commodities associated with this inventory
    commodities = db.query(Commodity).filter(Commodity.inventory_id == inventory_id).all()
    for commodity in commodities:
        db.delete(commodity)
    
    # Delete inventory
    db.delete(db_inventory)
    db.commit()
    
    return None

# Get inventories owned by the current trader
@router.get("/inventories/my-inventories/", response_model=List[InventoryResponse])
async def get_my_inventories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if user is a trader
    if current_user.user_type != UserType.TRADER:
        raise HTTPException(status_code=403, detail="Only traders can access their inventories")
    
    # Get the trader profile ID
    if not current_user.trader_profile:
        raise HTTPException(status_code=400, detail="Trader profile not found")
    
    # Get all inventories owned by current trader
    inventories = db.query(Inventory).filter(Inventory.trader_id == current_user.trader_profile.id).all()
    return inventories

# COMMODITY ENDPOINTS

# Create a new commodity in an inventory
@router.post("/inventories/{inventory_id}/commodities/", response_model=CommodityResponse)
async def create_commodity(
    inventory_id: int,
    commodity: CommodityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if inventory exists
    db_inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Check if current user owns the inventory
    if not current_user.trader_profile or current_user.trader_profile.id != db_inventory.trader_id:
        raise HTTPException(status_code=403, detail="You don't have permission to add commodities to this inventory")
    
    # Create new commodity
    db_commodity = Commodity(
        **commodity.dict(),
        inventory_id=inventory_id
    )
    
    db.add(db_commodity)
    db.commit()
    db.refresh(db_commodity)
    return db_commodity

# Get all commodities in an inventory
@router.get("/inventories/{inventory_id}/commodities/", response_model=List[CommodityResponse])
async def get_commodities(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if inventory exists
    db_inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Get all commodities in the inventory
    commodities = db.query(Commodity).filter(Commodity.inventory_id == inventory_id).all()
    return commodities

# Get a specific commodity by ID
@router.get("/commodities/{commodity_id}", response_model=CommodityResponse)
async def get_commodity(
    commodity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get commodity
    commodity = db.query(Commodity).filter(Commodity.id == commodity_id).first()
    if not commodity:
        raise HTTPException(status_code=404, detail="Commodity not found")
    
    return commodity

# Update a commodity (only for inventory owner)
@router.put("/commodities/{commodity_id}", response_model=CommodityResponse)
async def update_commodity(
    commodity_id: int,
    commodity_update: CommodityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if commodity exists
    db_commodity = db.query(Commodity).filter(Commodity.id == commodity_id).first()
    if not db_commodity:
        raise HTTPException(status_code=404, detail="Commodity not found")
    
    # Get inventory to check ownership
    db_inventory = db.query(Inventory).filter(Inventory.id == db_commodity.inventory_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Check if current user owns the inventory
    if not current_user.trader_profile or current_user.trader_profile.id != db_inventory.trader_id:
        raise HTTPException(status_code=403, detail="You don't have permission to update commodities in this inventory")
    
    # Update commodity fields
    update_data = commodity_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_commodity, key, value)
    
    db.commit()
    db.refresh(db_commodity)
    return db_commodity

# Delete a commodity (only for inventory owner)
@router.delete("/commodities/{commodity_id}", status_code=204)
async def delete_commodity(
    commodity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if commodity exists
    db_commodity = db.query(Commodity).filter(Commodity.id == commodity_id).first()
    if not db_commodity:
        raise HTTPException(status_code=404, detail="Commodity not found")
    
    # Get inventory to check ownership
    db_inventory = db.query(Inventory).filter(Inventory.id == db_commodity.inventory_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    # Check if current user owns the inventory
    if not current_user.trader_profile or current_user.trader_profile.id != db_inventory.trader_id:
        raise HTTPException(status_code=403, detail="You don't have permission to delete commodities from this inventory")
    
    # Delete commodity
    db.delete(db_commodity)
    db.commit()
    
    return None

# Get all commodities (for dropdown lists and reference)
@router.get("/commodities", response_model=List[CommodityResponse])
async def get_all_commodities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Fetch all commodities
    commodities = db.query(Commodity).all()
    return commodities 