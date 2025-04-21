# models.py - Database ORM models for the AgroTech application
# Implements SQLAlchemy models with proper relationships and constraints
from sqlalchemy import Column, Integer, String, Boolean, Float, Enum, ForeignKey, Date, DateTime, func, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum
from datetime import date
from typing import List, Literal

Base = declarative_base()

class UserType(str, enum.Enum):
    FARMER = "farmer"
    COMPANY = "company"
    TRADER = "trader"

class User(Base):
    """
    Base User model with common attributes for all user types.
    Contains core authentication and contact information.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    user_type = Column(Enum(UserType), nullable=False)
    
    # Common fields for both user types
    full_name = Column(String, nullable=False)
    mobile_number = Column(String, nullable=False)
    
    # Relationships
    farmer_profile = relationship("Farmer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    company_profile = relationship("Company", back_populates="user", uselist=False, cascade="all, delete-orphan")
    trader_profile = relationship("Trader", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Farmer(Base):
    """
    Farmer-specific attributes separated into their own table
    for better normalization and to avoid null values.
    """
    __tablename__ = "farmers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    farm_location = Column(String, nullable=False)
    farm_area = Column(Float, nullable=False)
    government_id = Column(String, nullable=True)  # File path to verification document
    
    # Relationship to User
    user = relationship("User", back_populates="farmer_profile")
    
    # Relationship to Farm
    farms = relationship("Farm", back_populates="farmer", cascade="all, delete-orphan")

class Company(Base):
    """
    Company-specific attributes separated into their own table
    for better normalization and to avoid null values.
    """
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    company_name = Column(String, nullable=False)
    company_type = Column(String, nullable=False)  # Food Processing, Exporter, Retailer, etc.
    company_location = Column(String, nullable=False)
    contact_person_designation = Column(String, nullable=False)
    company_gst_id = Column(String, nullable=True)  # File path to verification document
    
    # Relationship to User
    user = relationship("User", back_populates="company_profile")

class Trader(Base):
    """
    Trader-specific attributes separated into their own table
    for better normalization and to avoid null values.
    """
    __tablename__ = "traders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    address = Column(String, nullable=False)
    gst_number = Column(String, nullable=True)  # Optional GST number
    government_id = Column(String, nullable=True)  # Optional file path to verification document
    logistics_capability = Column(Boolean, default=False)
    storage_capacity_tons = Column(Float, nullable=True)
    commodities_dealt = Column(String, nullable=False)  # Stored as JSON string
    
    # Relationship to User
    user = relationship("User", back_populates="trader_profile")
    
    # Relationship to Inventory
    inventories = relationship("Inventory", back_populates="trader", cascade="all, delete-orphan")

class Inventory(Base):
    """
    Inventory entity representing a trader's storage facility/warehouse.
    Includes location data and capacity information.
    """
    __tablename__ = "inventories"
    
    id = Column(Integer, primary_key=True, index=True)
    trader_id = Column(Integer, ForeignKey("traders.id"), nullable=False)
    location_name = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    capacity = Column(Float, nullable=False)  # in MT (Metric Tons)
    image_url = Column(String, nullable=True)  # File path to inventory/warehouse image
    govt_documentation = Column(String, nullable=True)  # File path to government documentation
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    trader = relationship("Trader", back_populates="inventories")
    commodities = relationship("Commodity", back_populates="inventory", cascade="all, delete-orphan")
    images = relationship("InventoryImage", back_populates="inventory", cascade="all, delete-orphan")

class InventoryImage(Base):
    """Storage model for inventory images to facilitate visual verification"""
    __tablename__ = "inventory_images"
    
    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventories.id"), nullable=False)
    image_url = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationship
    inventory = relationship("Inventory", back_populates="images")

class Commodity(Base):
    """
    Commodity entity representing goods stored in a trader's inventory.
    Includes product details, quantity, pricing and quality information.
    """
    __tablename__ = "commodities"
    
    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventories.id"), nullable=False)
    name = Column(String, nullable=False)
    quantity_available = Column(Float, nullable=False)  # in MT or kg
    price_per_unit = Column(Float, nullable=False)
    harvested_date = Column(Date, nullable=True)
    testing_score = Column(Float, nullable=True)  # Platform's trust/quality score (e.g., 4.2/5 or 87%)
    tested_by_platform = Column(Boolean, default=False)
    additional_info = Column(String, nullable=True)  # Stored as JSON string
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationship
    inventory = relationship("Inventory", back_populates="commodities")

class FarmStatusEnum(str, enum.Enum):
    """Enumeration representing the current state of a farm's crop cycle"""
    EMPTY = "empty"
    GROWING = "growing"
    HARVESTED = "harvested"

class Farm(Base):
    """
    Farm entity representing agricultural land with its associated attributes.
    Contains geospatial data and crop-specific information.
    """
    __tablename__ = "farms"
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    farm_location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    farm_area = Column(Float, nullable=False)
    crop_type = Column(String, nullable=True)
    is_organic = Column(Boolean, default=False)
    pesticides_used = Column(String, nullable=True)
    expected_harvest_date = Column(Date, nullable=True)
    expected_quantity = Column(Float, nullable=True)
    min_asking_price = Column(Float, nullable=True)
    farm_status = Column(Enum(FarmStatusEnum), default=FarmStatusEnum.EMPTY)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    farmer = relationship("Farmer", back_populates="farms")
    images = relationship("FarmImage", back_populates="farm", cascade="all, delete-orphan")

class FarmImage(Base):
    """Storage model for farm images to facilitate visual verification and analysis"""
    __tablename__ = "farm_images"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    image_url = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationship
    farm = relationship("Farm", back_populates="images")


class GovScheme(Base):
    """
    Government scheme entity for agricultural support programs.
    Provides structured access to government initiatives.
    """
    __tablename__ = "gov_schemes"
    
    id = Column(Integer, primary_key=True, index=True)
    scheme_name = Column(String, nullable=False)
    detailed_description = Column(String, nullable=False)
    type = Column(String, nullable=False)
    url = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class CropHealthRecord(Base):
    """
    Stores disease detection results and associated metadata.
    Enables historical analysis and trend identification.
    """
    __tablename__ = "crop_health_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_path = Column(String, nullable=False)
    detected_disease = Column(String, nullable=True)
    scientific_name = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=True)
    timestamp = Column(DateTime, server_default=func.now())
    notes = Column(String, nullable=True)
    
    # Relationship
    user = relationship("User")

class RequirementStatusEnum(str, enum.Enum):
    """Enumeration representing the current state of a company requirement"""
    OPEN = "open"
    CLOSED = "closed"
    IN_DISCUSSION = "in_discussion"
    FULFILLED = "fulfilled"

class Requirement(Base):
    """
    Requirement entity representing a company's demand for agricultural commodities.
    Contains details about product, quantity, pricing and delivery requirements.
    """
    __tablename__ = "requirements"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    commodity_type = Column(String, nullable=False)
    quantity_required = Column(Float, nullable=False)  # in MT
    delivery_location = Column(String, nullable=True)
    delivery_lat = Column(Float, nullable=True)
    delivery_long = Column(Float, nullable=True)
    expected_price_min = Column(Float, nullable=True)
    expected_price_max = Column(Float, nullable=True)
    requirement_type = Column(String, nullable=False)  # 'current' or 'future'
    delivery_window_start = Column(Date, nullable=False)
    delivery_window_end = Column(Date, nullable=False)
    description = Column(String, nullable=True)
    status = Column(Enum(RequirementStatusEnum), default=RequirementStatusEnum.OPEN)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", backref="requirements")
    applications = relationship("TraderApplication", back_populates="requirement", cascade="all, delete-orphan")

class TraderApplicationStatusEnum(str, enum.Enum):
    """Enumeration representing the status of a trader's application to a requirement"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class TraderApplication(Base):
    """
    TraderApplication entity representing a trader's proposal to fulfill a company's requirement.
    Contains details about pricing, quantities, and delivery timing.
    """
    __tablename__ = "trader_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id"), nullable=False)
    trader_id = Column(Integer, ForeignKey("traders.id"), nullable=False)
    inventory_id = Column(Integer, ForeignKey("inventories.id"), nullable=False)
    proposed_quantity = Column(Float, nullable=False)  # in MT
    proposed_price = Column(Float, nullable=False)  # per unit
    eta = Column(Date, nullable=False)  # estimated time of arrival/delivery
    message = Column(String, nullable=True)
    status = Column(Enum(TraderApplicationStatusEnum), default=TraderApplicationStatusEnum.PENDING)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    requirement = relationship("Requirement", back_populates="applications")
    trader = relationship("Trader", backref="applications")
    inventory = relationship("Inventory", backref="applications")

class DealStatusEnum(str, enum.Enum):
    """Enumeration representing the status of a deal between a company and trader"""
    IN_DISCUSSION = "in_discussion"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"

class Deal(Base):
    """
    Deal entity representing a finalized agreement between a company and trader.
    Tracks the full lifecycle of the transaction from agreement to delivery.
    """
    __tablename__ = "deals"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    trader_id = Column(Integer, ForeignKey("traders.id"), nullable=False)
    inventory_id = Column(Integer, ForeignKey("inventories.id"), nullable=False)
    requirement_id = Column(Integer, ForeignKey("requirements.id"), nullable=True)  # Optional, may be null for direct deals
    commodity_type = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)  # in MT
    price = Column(Float, nullable=False)  # per unit
    eta = Column(Date, nullable=False)  # estimated time of arrival/delivery
    status = Column(Enum(DealStatusEnum), default=DealStatusEnum.IN_DISCUSSION)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", backref="deals")
    trader = relationship("Trader", backref="deals")
    inventory = relationship("Inventory", backref="deals")
    requirement = relationship("Requirement", backref="deals")
