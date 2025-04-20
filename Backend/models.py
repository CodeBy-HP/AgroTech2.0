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
    
    # Relationship to Bids
    bids = relationship("Bid", back_populates="trader", cascade="all, delete-orphan")

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
    bids = relationship("Bid", back_populates="farm", cascade="all, delete-orphan")

class FarmImage(Base):
    """Storage model for farm images to facilitate visual verification and analysis"""
    __tablename__ = "farm_images"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    image_url = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationship
    farm = relationship("Farm", back_populates="images")

class BidStatusEnum(str, enum.Enum):
    """Status tracking for the bidding workflow process"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class Bid(Base):
    """
    Bid entity representing offers from traders to farmers.
    Implements a complete transaction tracking system.
    """
    __tablename__ = "bids"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    trader_id = Column(Integer, ForeignKey("traders.id"), nullable=False)
    bid_amount = Column(Float, nullable=False)
    bid_date = Column(DateTime, server_default=func.now())
    status = Column(Enum(BidStatusEnum), default=BidStatusEnum.PENDING, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    farm = relationship("Farm", back_populates="bids")
    trader = relationship("Trader", back_populates="bids")

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
