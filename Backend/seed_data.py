import sys
import os
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import random
from typing import List

from database import get_db, engine
from models import Base, User, Farm, Bid, UserType, FarmStatusEnum, BidStatusEnum, FarmImage

# Password handling
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

# More realistic Indian farm locations with coordinates
FARM_LOCATIONS = [
    {"name": "Amritsar, Punjab", "lat": 31.6340, "lng": 74.8723},
    {"name": "Ludhiana, Punjab", "lat": 30.9010, "lng": 75.8573},
    {"name": "Karnal, Haryana", "lat": 29.6857, "lng": 76.9905},
    {"name": "Hisar, Haryana", "lat": 29.1492, "lng": 75.7217},
    {"name": "Meerut, Uttar Pradesh", "lat": 28.9845, "lng": 77.7064},
    {"name": "Lucknow, Uttar Pradesh", "lat": 26.8467, "lng": 80.9462},
    {"name": "Nashik, Maharashtra", "lat": 19.9975, "lng": 73.7898},
    {"name": "Pune, Maharashtra", "lat": 18.5204, "lng": 73.8567},
    {"name": "Bangalore, Karnataka", "lat": 12.9716, "lng": 77.5946},
    {"name": "Mysore, Karnataka", "lat": 12.2958, "lng": 76.6394},
    {"name": "Bhopal, Madhya Pradesh", "lat": 23.2599, "lng": 77.4126},
    {"name": "Indore, Madhya Pradesh", "lat": 22.7196, "lng": 75.8577},
    {"name": "Ahmedabad, Gujarat", "lat": 23.0225, "lng": 72.5714},
    {"name": "Vadodara, Gujarat", "lat": 22.3072, "lng": 73.1812},
    {"name": "Jaipur, Rajasthan", "lat": 26.9124, "lng": 75.7873},
    {"name": "Kota, Rajasthan", "lat": 25.2138, "lng": 75.8648}
]

# Realistic Indian crop types by region
CROP_TYPES = {
    "Punjab": ["Wheat", "Rice", "Maize", "Sugarcane", "Cotton"],
    "Haryana": ["Wheat", "Rice", "Barley", "Sugarcane", "Mustard"],
    "Uttar Pradesh": ["Wheat", "Rice", "Sugarcane", "Pulses", "Potatoes"],
    "Maharashtra": ["Jowar", "Bajra", "Cotton", "Sugarcane", "Grapes", "Onions"],
    "Karnataka": ["Rice", "Ragi", "Jowar", "Coffee", "Sugarcane", "Sunflower"],
    "Madhya Pradesh": ["Wheat", "Soybeans", "Pulses", "Rice", "Maize"],
    "Gujarat": ["Groundnut", "Cotton", "Wheat", "Mustard", "Cumin"],
    "Rajasthan": ["Bajra", "Pulses", "Wheat", "Mustard", "Maize"]
}

# Realistic organic pesticides and fertilizers
ORGANIC_PESTICIDES = [
    "Neem oil spray", "Garlic-based spray", "Cow urine spray", 
    "Buttermilk spray", "Turmeric powder spray", "Neem cake",
    "Panchagavya", "Jeevamrutha", "Vermicompost", "Organic mulch"
]

# Realistic chemical pesticides and fertilizers
CHEMICAL_PESTICIDES = [
    "Urea", "NPK 10:26:26", "DAP", "NPK 20:20:0", "Potash",
    "Chlorpyrifos", "Cypermethrin", "Imidacloprid", "Endosulfan",
    "Mancozeb", "Carbendazim", "Glyphosate"
]

# Company types in Indian agri-business
COMPANY_TYPES = [
    "Food Processor", "Exporter", "Retailer", "Wholesaler", 
    "Supermarket Chain", "Restaurant Chain", "E-commerce Platform",
    "Farm-to-Fork Startup", "Organic Food Brand", "Agricultural Cooperative"
]

# Indian company names
COMPANY_NAMES = [
    "Adani Agri Fresh Ltd", "ITC Agri Business", "Godrej Agrovet", 
    "Mahindra Agri Solutions", "Nuziveedu Seeds", "DCM Shriram",
    "Bharti Enterprises", "Reliance Fresh", "BigBasket", "Patanjali",
    "Nature's Basket", "Cargill India", "Heritage Foods",
    "Ruchi Soya Industries", "Nandan Biomatrix", "Jain Irrigation"
]

# Indian person names
INDIAN_NAMES = [
    "Rajesh Sharma", "Sunil Patel", "Anil Kumar", "Vikram Singh", "Ajay Verma",
    "Priya Desai", "Neha Gupta", "Sanjay Joshi", "Amit Malhotra", "Rahul Kapoor",
    "Meera Reddy", "Kavita Rao", "Deepak Chauhan", "Prakash Yadav", "Sunita Agarwal",
    "Ramesh Nair", "Anita Saxena", "Kiran Kumar", "Vijay Menon", "Shalini Bhat",
    "Mohammed Khan", "Ravi Naidu", "Pooja Mehta", "Arun Thomas", "Divya Sinha"
]

# Indian village/small town names for farm locations
FARM_VILLAGES = [
    "Palwal", "Rewari", "Sonipat", "Panipat", "Jhajjar", 
    "Bahadurgarh", "Rohtak", "Faridabad", "Gurgaon", "Ambala",
    "Dharamshala", "Shimla", "Bathinda", "Firozpur", "Hoshiarpur",
    "Jalandhar", "Kapurthala", "Rupnagar", "Fatehgarh Sahib", "Mohali"
]

def get_farmer_village():
    state = random.choice(list(CROP_TYPES.keys()))
    village = random.choice(FARM_VILLAGES)
    return f"{village}, {state}", state

def get_farm_location():
    location = random.choice(FARM_LOCATIONS)
    # Add a little randomness to coordinates for variety
    lat_offset = random.uniform(-0.05, 0.05)
    lng_offset = random.uniform(-0.05, 0.05)
    return {
        "name": location["name"],
        "lat": location["lat"] + lat_offset,
        "lng": location["lng"] + lng_offset,
        "state": location["name"].split(", ")[1]
    }

def get_crops_for_state(state):
    # Extract state from location string like "City, State"
    for key in CROP_TYPES:
        if key in state:
            return CROP_TYPES[key]
    return random.choice(list(CROP_TYPES.values()))

def seed_database():
    db = next(get_db())
    
    try:
        print("Creating farmers with realistic Indian data...")
        farmers = []
        
        for i in range(1, 21):
            village, state = get_farmer_village()
            farmer_name = random.choice(INDIAN_NAMES)
            farmers.append({
                "username": f"farmer{i}",
                "email": f"farmer{i}@example.com", 
                "hashed_password": hash_password("123"),
                "is_active": True, 
                "user_type": UserType.FARMER, 
                "full_name": farmer_name, 
                "mobile_number": f"9{random.randint(700000000, 999999999)}", 
                "farm_location": village, 
                "farm_area": random.randint(10, 500) / 10, 
                "government_id": f"AADHAR{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
            })
        
        for farmer_data in farmers:
            db.add(User(**farmer_data))
        db.commit()
        
        print("Creating companies with realistic Indian data...")
        
        companies = []
        used_company_names = set()
        
        for i in range(1, 16):
            while True:
                company_name = random.choice(COMPANY_NAMES)
                if company_name not in used_company_names:
                    used_company_names.add(company_name)
                    break
            
            manager_name = random.choice(INDIAN_NAMES)
            company_type = random.choice(COMPANY_TYPES)
            location = random.choice(FARM_LOCATIONS)["name"]
            
            companies.append({
                "username": f"company{i}", 
                "email": f"contact@{company_name.lower().replace(' ', '')}.com", 
                "hashed_password": hash_password("123"),
                "is_active": True, 
                "user_type": UserType.COMPANY, 
                "full_name": manager_name, 
                "mobile_number": f"9{random.randint(700000000, 999999999)}", 
                "company_name": company_name, 
                "company_type": company_type, 
                "company_location": location, 
                "contact_person_designation": random.choice(["CEO", "Manager", "Director", "Procurement Head", "Supply Chain Manager"]), 
                "company_gst_id": f"GST{random.randint(10, 99)}ABCDE{random.randint(1000, 9999)}Z{random.randint(1, 9)}"
            })
        
        for company_data in companies:
            db.add(User(**company_data))
        db.commit()
        
        print("Creating farms with realistic crops and locations...")
        today = date.today()
        
        farms = []
        
        for i in range(1, 41):
            farm_location = get_farm_location()
            state = farm_location["state"]
            crops = get_crops_for_state(state)
            crop = random.choice(crops)
            is_organic = random.choice([True, False])
            pesticides = random.sample(ORGANIC_PESTICIDES, k=random.randint(1, 3)) if is_organic else random.sample(CHEMICAL_PESTICIDES, k=random.randint(1, 3))
            
            # Calculate a realistic harvest date based on crop type
            days_to_harvest = random.randint(30, 180)  # Between 1-6 months
            harvest_date = today + timedelta(days=days_to_harvest)
            
            # Set farm status based on harvest date
            if harvest_date < today:
                farm_status = FarmStatusEnum.HARVESTED
            elif (harvest_date - today).days < 30:
                farm_status = FarmStatusEnum.GROWING
            else:
                farm_status = FarmStatusEnum.EMPTY
            
            farmer_id = random.randint(1, len(farmers))
            
            farms.append({
                "farmer_username": f"farmer{farmer_id}", 
                "farm_location": farm_location["name"], 
                "latitude": str(farm_location["lat"]), 
                "longitude": str(farm_location["lng"]), 
                "farm_area": random.randint(50, 3000) / 10, 
                "crop_type": crop, 
                "is_organic": is_organic, 
                "pesticides_used": ", ".join(pesticides), 
                "expected_harvest_date": harvest_date,
                "expected_quantity": random.randint(100, 5000), 
                "min_asking_price": random.randint(1000, 8000), 
                "farm_status": farm_status
            })
        
        # Keep track of farm IDs
        farm_ids = []
        for farm_data in farms:
            farm = Farm(**farm_data)
            db.add(farm)
            db.flush()  # This gives us the ID without committing
            farm_ids.append(farm.id)
        
        db.commit()
        
        print("Adding farm images using existing image files...")
        
        # Find all available images
        image_dir = os.path.join("media", "farm_images")
        image_files = []
        
        # Add all .jpg, .png, and .webp files
        for i in range(1, 17):  # Based on the file list provided (1.jpg to 16.jpg)
            extension = ".jpg"
            if i == 4:  # Special case for 4.webp
                extension = ".webp"
            image_files.append(f"{i}{extension}")
        
        # Associate images with farms (2-4 images per farm)
        farm_images = []
        
        for farm_id in farm_ids:
            # Determine how many images for this farm (2-4)
            num_images = random.randint(2, 4)
            farm_image_files = random.sample(image_files, min(num_images, len(image_files)))
            
            for img_file in farm_image_files:
                image_url = f"/media/farm_images/{img_file}"
                created_at = datetime.now() - timedelta(days=random.randint(1, 30))
                
                farm_images.append({
                    "farm_id": farm_id,
                    "image_url": image_url,
                    "created_at": created_at
                })
        
        for image_data in farm_images:
            db.add(FarmImage(**image_data))
        db.commit()
        
        print("Creating realistic bids...")
        
        bids = []
        bid_statuses = [BidStatusEnum.PENDING, BidStatusEnum.ACCEPTED, BidStatusEnum.REJECTED]
        weights = [0.6, 0.3, 0.1]  # More pending, some accepted, few rejected
        
        for farm_id in farm_ids:
            # Get farm details for realistic bid amounts
            farm = db.query(Farm).filter(Farm.id == farm_id).first()
            
            # Generate 0-5 bids per farm
            num_bids = random.randint(0, 5)
            if num_bids > 0:
                # Select random traders to make bids
                bidding_traders = random.sample(range(1, len(companies) + 1), min(num_bids, len(companies)))
                
                for trader_idx in bidding_traders:
                    # Base bid amount on the farm's asking price with some variation
                    min_price = farm.min_asking_price
                    max_variation = min_price * 0.4  # Up to 40% variation
                    
                    # Bid can be lower or higher than asking price
                    variation = random.uniform(-max_variation * 0.2, max_variation)
                    bid_amount = min_price + variation
                    
                    bid_date = datetime.now() - timedelta(days=random.randint(1, 30))
                    status = random.choices(bid_statuses, weights=weights)[0]
                    
                    # If the farm is harvested, all bids should be resolved
                    if farm.farm_status == FarmStatusEnum.HARVESTED:
                        status = random.choice([BidStatusEnum.ACCEPTED, BidStatusEnum.REJECTED])
                    
                    updated_at = bid_date
                    if status != BidStatusEnum.PENDING:
                        # If bid is accepted/rejected, update timestamp to be after bid date
                        updated_at = bid_date + timedelta(days=random.randint(1, 5))
                    
                    bids.append({
                        "farm_id": farm_id, 
                        "trader_id": trader_idx,
                        "bid_amount": max(1000, round(bid_amount, 2)),  # Ensure minimum bid amount
                        "bid_date": bid_date, 
                        "status": status,
                        "updated_at": updated_at
                    })
        
        for bid_data in bids:
            db.add(Bid(**bid_data))
        db.commit()
        
        print("Database seeded successfully with realistic Indian agricultural data!")
    
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == '--reset':
        print("Dropping and recreating tables...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
    
    print("Seeding database with realistic Indian agricultural data...")
    if seed_database():
        print("Test data has been added successfully!")
    else:
        print("Failed to add test data.")