from fastapi import FastAPI, Depends, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from contextlib import asynccontextmanager

from app.config import settings
from app.database import Base, engine, get_db
from app.core.logging import setup_logging, RequestLoggingMiddleware
from app.core.exceptions import (
    BankTwinException,
    bank_twin_exception_handler,
    global_exception_handler,
)
from app.api.router import api_router

# Services for backward compatibility aliases
from app.services.kpi_service import compute_kpis
from app.services.generator_service import seed_database
from app.services.stress_service import run_and_persist_stress_test
from app.simulation.monte_carlo import run_monte_carlo_vectorized
from app.models.customer import Customer
from app.models.loan import Loan
from app.models.stress_run import StressRun
from app.schemas.customer import CustomerOut
from app.schemas.loan import LoanOut
from app.schemas.stress import StressTestRequest, StressTestResponse, StressRunOut

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure models loaded and create database tables if not exist
    import app.models  # noqa
    Base.metadata.create_all(bind=engine)
    
    # Ensure default demo user accounts exist
    from app.database import SessionLocal
    from app.models.user import User
    from app.core.security import hash_password

    db = SessionLocal()
    try:
        demo_users = [
            ("atulcoder27@gmail.com", "atul", "password123"),
            ("analyst_1562@bankdigitaltwin.com", "Demo Risk Analyst", "password123"),
        ]
        for email, name, pwd in demo_users:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                db.add(User(
                    email=email,
                    hashed_password=hash_password(pwd),
                    full_name=name,
                    role="analyst"
                ))
            else:
                u.hashed_password = hash_password(pwd)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Financial Simulation & Stress Testing Engine for Synthetic Banking Portfolios.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Exception Handlers
app.add_exception_handler(BankTwinException, bank_twin_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Middleware
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(api_router, prefix=settings.API_PREFIX)


# =====================================================================
# BACKWARD COMPATIBILITY ENDPOINTS (Legacy routes without /v1 prefix)
# =====================================================================

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
    }


@app.post("/api/generate", tags=["Legacy Compatibility"])
def legacy_generate(n_customers: int = 5000, db: Session = Depends(get_db)):
    stats = seed_database(db, n_customers=n_customers)
    return {"message": "generated", **stats}


@app.get("/api/customers", tags=["Legacy Compatibility"])
def legacy_list_customers(limit: int = 100, db: Session = Depends(get_db)):
    customers = db.query(Customer).limit(limit).all()
    return [CustomerOut.model_validate(c) for c in customers]


@app.get("/api/loans", tags=["Legacy Compatibility"])
def legacy_list_loans(limit: int = 200, db: Session = Depends(get_db)):
    loans = db.query(Loan).limit(limit).all()
    return [LoanOut.model_validate(l) for l in loans]


@app.get("/api/kpis", tags=["Legacy Compatibility"])
def legacy_get_kpis(db: Session = Depends(get_db)):
    return compute_kpis(db)


@app.post("/api/stress-test", response_model=StressTestResponse, tags=["Legacy Compatibility"])
def legacy_stress_test(req: StressTestRequest, db: Session = Depends(get_db)):
    return run_and_persist_stress_test(db, req)


@app.get("/api/stress-runs", response_model=List[StressRunOut], tags=["Legacy Compatibility"])
def legacy_list_stress_runs(db: Session = Depends(get_db)):
    runs = db.query(StressRun).order_by(StressRun.created_at.desc()).limit(50).all()
    return [StressRunOut.model_validate(r) for r in runs]
