import os
import shutil
from fastapi import UploadFile
from pathlib import Path
import uuid

# Create media directory if it doesn't exist
MEDIA_DIR = Path("media")
FARM_IMAGES_DIR = MEDIA_DIR / "farm_images"
INVENTORY_IMAGES_DIR = MEDIA_DIR / "inventory_images"
FARM_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
INVENTORY_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

async def save_upload_file(upload_file: UploadFile, directory: Path = FARM_IMAGES_DIR) -> str:
    """
    Save an uploaded file to the specified directory and return the file path.
    
    Args:
        upload_file: The uploaded file
        directory: Directory to save the file in
        
    Returns:
        The path to the saved file (relative to the media directory)
    """
    # Generate a unique filename to avoid collisions
    file_extension = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = directory / unique_filename
    
    # Create a temporary file to store the upload
    with open(file_path, "wb") as buffer:
        # Copy file contents to destination
        shutil.copyfileobj(upload_file.file, buffer)
    
    # Reset the file pointer
    await upload_file.seek(0)
    
    # Return relative path for storage in database
    relative_dir = f"{directory.name}"
    return f"/media/{relative_dir}/{unique_filename}"

def delete_file(file_path: str) -> bool:
    """
    Delete a file given its path.
    
    Args:
        file_path: Path to the file to delete (as stored in the database)
        
    Returns:
        True if the file was deleted, False otherwise
    """
    # Convert to absolute path
    abs_path = Path(".") / file_path.lstrip("/")
    
    try:
        if abs_path.exists():
            abs_path.unlink()
            return True
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    return False 