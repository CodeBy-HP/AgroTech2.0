# main.py - FastAPI application entry point
# Implements core API functionality with CORS, middleware and router configurations
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
from dotenv import load_dotenv

from routers import auth, user, farm, schemes, crop_health, inventory, requirements, company

# Initialize environment variables from .env file
# Critical for secure credential management in development and production
load_dotenv()

app = FastAPI(debug=True)

# Configure CORS middleware based on environment settings
# Allows for flexibility between development and production environments
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
origins = allowed_origins.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure media directories exist for file storage
# Implements a standardized approach to file management
media_dir = Path("media")
media_dir.mkdir(exist_ok=True)

# Create dedicated directory for crop disease detection images
# Separating concerns for better organization of uploaded files
crop_images_dir = Path("media/crop_images")
crop_images_dir.mkdir(exist_ok=True)

# Create dedicated directory for inventory images
inventory_images_dir = Path("media/inventory_images")
inventory_images_dir.mkdir(exist_ok=True)

# Configure static file serving
# Enables direct access to media files via URL
app.mount("/media", StaticFiles(directory="media"), name="media")

# Register API routers - modular architecture for maintainability
app.include_router(user.router)
app.include_router(auth.router, prefix="/auth")
app.include_router(farm.router)
app.include_router(inventory.router)
app.include_router(schemes.router)
app.include_router(crop_health.router)
app.include_router(requirements.router)
app.include_router(company.router)

@app.get("/")
async def root():
    return {"message": "Welcome to AgroTech API"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
