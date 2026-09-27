from fastapi import APIRouter, Depends, Query, BackgroundTasks, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.generator_service import seed_database, import_csv_bank_data

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


@router.post("/import-csv")
async def import_bank_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported.")
    try:
        content = await file.read()
        csv_text = content.decode("utf-8")
        stats = import_csv_bank_data(db, csv_text)
        return {
            "status": "success",
            "message": f"Successfully imported {stats['customers']} portfolio records from CSV.",
            **stats,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to import CSV: {str(e)}")
