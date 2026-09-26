from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.kpi import KpiResponse, KpiTrendResponse
from app.services.kpi_service import compute_kpis, compute_kpis_with_trends

router = APIRouter(prefix="/kpis", tags=["KPIs"])


@router.get("", response_model=KpiResponse)
def get_kpis(db: Session = Depends(get_db)):
    return compute_kpis(db)


@router.get("/trends", response_model=KpiTrendResponse)
def get_kpi_trends(db: Session = Depends(get_db)):
    return compute_kpis_with_trends(db)
