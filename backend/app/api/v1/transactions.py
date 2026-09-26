from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
import math

from app.database import get_db
from app.schemas.transaction import TransactionOut, TransactionGenerateRequest, TransactionSummary
from app.schemas.pagination import PaginatedResponse
from app.services.transaction_service import generate_transactions, get_transactions, get_transaction_summary

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=PaginatedResponse[TransactionOut])
def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    customer_id: Optional[UUID] = Query(None),
    account_id: Optional[UUID] = Query(None),
    is_flagged: Optional[bool] = Query(None),
    type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    items, total = get_transactions(
        db,
        page=page,
        page_size=page_size,
        customer_id=customer_id,
        account_id=account_id,
        is_flagged=is_flagged,
        tx_type=type
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return PaginatedResponse(
        items=[TransactionOut.model_validate(it) for it in items],
        total=total,
        page=page,
        size=page_size,
        pages=total_pages
    )


@router.post("/generate", response_model=dict)
def generate_synthetic_transactions(
    req: TransactionGenerateRequest = TransactionGenerateRequest(),
    db: Session = Depends(get_db)
):
    created = generate_transactions(db, count=req.count)
    return {
        "message": f"Successfully generated {len(created)} synthetic transactions",
        "generated_count": len(created)
    }


@router.get("/summary", response_model=TransactionSummary)
def get_summary(db: Session = Depends(get_db)):
    summary = get_transaction_summary(db)
    return TransactionSummary(**summary)
