from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.forecast import ForecastResponse
from app.services.forecast_service import compute_forecast

router = APIRouter(prefix="/forecasts", tags=["forecasts"])


@router.get("", response_model=ForecastResponse)
def get_metric_forecast(
    metric: str = Query("car", description="Metric to forecast (car, npl_ratio, deposits, liquidity_ratio)"),
    horizon: int = Query(30, description="Forecast horizon in days (30, 90, 365)"),
    db: Session = Depends(get_db)
):
    return compute_forecast(db, metric=metric, horizon_days=horizon)
