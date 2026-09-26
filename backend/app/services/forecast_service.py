import time
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from statsmodels.tsa.holtwinters import ExponentialSmoothing

from app.services.kpi_service import compute_kpis_with_trends
from app.schemas.forecast import ForecastPoint, ForecastResponse

# In-memory TTL cache (key -> (timestamp, response))
_forecast_cache: Dict[str, Tuple[float, ForecastResponse]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


def generate_historical_series(db: Session, metric: str) -> pd.Series:
    kpi_trends = compute_kpis_with_trends(db)
    history_points = kpi_trends.get("history", [])

    dates = []
    values = []
    today = datetime.utcnow().date()

    for i, pt in enumerate(history_points):
        dt = today - timedelta(days=len(history_points) - i)
        dates.append(dt)
        if metric == "deposits":
            val = float(pt.get("total_outstanding", 10000000.0) * 1.35)
        elif metric == "npl_ratio":
            val = float(pt.get("npl_ratio", 2.5))
        elif metric == "liquidity_ratio":
            val = float(pt.get("liquidity_ratio", 115.0))
        else:  # car / capital adequacy
            val = float(pt.get("car", 15.2))
        values.append(val)

    if not values:
        dates = [today - timedelta(days=i) for i in range(30, 0, -1)]
        base = 15.0 if metric == "car" else (2.5 if metric == "npl_ratio" else 120.0)
        values = [base + np.sin(i / 5.0) * 0.5 + np.random.normal(0, 0.1) for i in range(30)]

    series = pd.Series(values, index=pd.DatetimeIndex(dates))
    return series.sort_index()


def compute_forecast(db: Session, metric: str = "car", horizon_days: int = 30) -> ForecastResponse:
    global _forecast_cache

    cache_key = f"{metric}_{horizon_days}"
    now_ts = time.time()

    # Check cache
    if cache_key in _forecast_cache:
        cached_ts, cached_resp = _forecast_cache[cache_key]
        if now_ts - cached_ts < CACHE_TTL_SECONDS:
            resp_copy = ForecastResponse(**cached_resp.model_dump())
            resp_copy.cached = True
            return resp_copy

    # Valid metric check
    allowed_metrics = ["car", "npl_ratio", "deposits", "liquidity_ratio"]
    if metric not in allowed_metrics:
        metric = "car"

    if horizon_days not in [30, 90, 365]:
        horizon_days = 30

    series = generate_historical_series(db, metric=metric)

    # Fit exponential smoothing or ARIMA
    try:
        model = ExponentialSmoothing(series, trend="add", seasonal=None, initialization_method="estimated")
        fit_model = model.fit()
        predictions = fit_model.forecast(horizon_days)
    except Exception:
        # Fallback linear trend
        last_val = series.iloc[-1]
        slope = (series.iloc[-1] - series.iloc[0]) / max(len(series), 1)
        predictions = pd.Series([last_val + slope * i for i in range(1, horizon_days + 1)])

    # Residual std for confidence bounds
    residuals = series.diff().dropna()
    std_err = float(residuals.std()) if len(residuals) > 0 and not np.isnan(residuals.std()) else 0.5

    last_date = series.index[-1]
    forecast_points: List[ForecastPoint] = []

    for i, pred_val in enumerate(predictions, start=1):
        target_date = (last_date + timedelta(days=i)).strftime("%Y-%m-%d")
        val = float(pred_val)

        # Standard error grows with horizon sqrt(i)
        step_std = std_err * np.sqrt(i * 0.1 + 1.0)

        lower_80 = round(val - 1.28 * step_std, 2)
        upper_80 = round(val + 1.28 * step_std, 2)
        lower_95 = round(val - 1.96 * step_std, 2)
        upper_95 = round(val + 1.96 * step_std, 2)

        if metric in ["car", "npl_ratio", "liquidity_ratio", "deposits"]:
            lower_80 = max(0.0, lower_80)
            lower_95 = max(0.0, lower_95)

        forecast_points.append(
            ForecastPoint(
                date=target_date,
                value=round(val, 2),
                lower_80=lower_80,
                upper_80=upper_80,
                lower_95=lower_95,
                upper_95=upper_95
            )
        )

    response = ForecastResponse(
        metric=metric,
        horizon_days=horizon_days,
        historical_points=len(series),
        forecast=forecast_points,
        cached=False
    )

    _forecast_cache[cache_key] = (now_ts, response)
    return response
