from fastapi import APIRouter
from app.api.v1 import (
    customers,
    loans,
    kpis,
    stress,
    scenarios,
    generator,
    health,
    auth,
    ml_risk,
    ai,
    transactions,
    fraud,
    forecasts,
    what_if,
    compliance,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(ml_risk.router)
api_router.include_router(ai.router)
api_router.include_router(customers.router)
api_router.include_router(loans.router)
api_router.include_router(kpis.router)
api_router.include_router(scenarios.router)
api_router.include_router(stress.router)
api_router.include_router(generator.router)
api_router.include_router(transactions.router)
api_router.include_router(fraud.router)
api_router.include_router(forecasts.router)
api_router.include_router(what_if.router)
api_router.include_router(compliance.router)
