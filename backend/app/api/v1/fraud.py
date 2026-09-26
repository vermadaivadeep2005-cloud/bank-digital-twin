from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.fraud import FraudScanRequest, FraudScanResult, FraudAlertResponse, FraudTrainResponse
from app.services.fraud_service import scan_transactions, get_fraud_alerts, train_isolation_forest

router = APIRouter(prefix="/fraud", tags=["fraud"])


@router.post("/scan", response_model=List[FraudScanResult])
def scan_fraud(
    req: FraudScanRequest = FraudScanRequest(),
    db: Session = Depends(get_db)
):
    return scan_transactions(db, limit=req.limit, transaction_id=req.transaction_id)


@router.get("/alerts", response_model=FraudAlertResponse)
def list_fraud_alerts(db: Session = Depends(get_db)):
    return get_fraud_alerts(db)


@router.post("/train", response_model=FraudTrainResponse)
def train_fraud_model(db: Session = Depends(get_db)):
    return train_isolation_forest(db)
