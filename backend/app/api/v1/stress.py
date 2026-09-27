from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.stress_run import StressRun
from app.schemas.stress import (
    StressTestRequest,
    StressTestResponse,
    StressRunOut,
    ReverseStressRequest,
    ReverseStressResponse,
)
from app.services.stress_service import run_and_persist_stress_test, run_and_persist_reverse_stress_test
from app.core.exceptions import NotFoundError

router = APIRouter(tags=["Stress Testing"])


@router.post("/stress-test", response_model=StressTestResponse)
def run_stress_test(req: StressTestRequest, db: Session = Depends(get_db)):
    return run_and_persist_stress_test(db, req)


@router.post("/stress/reverse-test", response_model=ReverseStressResponse)
def run_reverse_stress_test(req: ReverseStressRequest, db: Session = Depends(get_db)):
    return run_and_persist_reverse_stress_test(db, req)


@router.get("/stress-runs", response_model=List[StressRunOut])
def list_stress_runs(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    runs = db.query(StressRun).order_by(StressRun.created_at.desc()).limit(limit).all()
    return [StressRunOut.model_validate(r) for r in runs]


@router.get("/stress-runs/{run_id}", response_model=StressRunOut)
def get_stress_run(run_id: UUID, db: Session = Depends(get_db)):
    run = db.query(StressRun).filter(StressRun.id == run_id).first()
    if not run:
        raise NotFoundError("StressRun", str(run_id))
    return StressRunOut.model_validate(run)


@router.delete("/stress-runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stress_run(run_id: UUID, db: Session = Depends(get_db)):
    run = db.query(StressRun).filter(StressRun.id == run_id).first()
    if not run:
        raise NotFoundError("StressRun", str(run_id))
    db.delete(run)
    db.commit()
    return None
