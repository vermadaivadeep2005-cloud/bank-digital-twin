from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.generator_service import seed_database

router = APIRouter(prefix="/generate", tags=["Generator"])


@router.post("")
def generate_bank(
    n_customers: int = Query(5000, ge=100, le=20000, description="Number of synthetic customers to generate"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    stats = seed_database(db, n_customers=n_customers)
    return {
        "status": "success",
        "message": f"Successfully generated synthetic bank with {n_customers} customers.",
        **stats,
    }
