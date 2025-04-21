from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth.auth_handler import get_current_active_user
from database import get_db
from models import User, Company
from schemas import CompanyResponse

router = APIRouter()

@router.get("/api/companies/{company_id}", response_model=dict)
async def get_company(
    company_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get company information by ID"""
    company = db.query(Company).filter(Company.id == company_id).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return {
        "id": company.id,
        "company_name": company.company_name,
        "company_type": company.company_type,
        "company_location": company.company_location,
        "contact_person_designation": company.contact_person_designation,
        "name": company.company_name  # Added for compatibility with frontend
    } 