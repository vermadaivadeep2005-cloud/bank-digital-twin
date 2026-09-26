from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.loan import Loan
from app.schemas.loan import LoanOut
from app.schemas.pagination import PaginatedResponse

router = APIRouter(prefix="/loans", tags=["Loans"])


@router.get("", response_model=PaginatedResponse[LoanOut])
def list_loans(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
    loan_type: Optional[str] = Query(None, description="Filter by loan type (mortgage, personal, auto, business)"),
    status: Optional[str] = Query(None, description="Filter by status (current, delinquent, default)"),
    region: Optional[str] = Query(None, description="Filter by region"),
    min_outstanding: Optional[float] = Query(None, ge=0),
    max_outstanding: Optional[float] = Query(None, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Loan)

    if loan_type:
        query = query.filter(Loan.loan_type == loan_type)
    if status:
        query = query.filter(Loan.status == status)
    if region:
        query = query.filter(Loan.region == region)
    if min_outstanding is not None:
        query = query.filter(Loan.outstanding >= min_outstanding)
    if max_outstanding is not None:
        query = query.filter(Loan.outstanding <= max_outstanding)

    total = query.count()
    pages = (total + size - 1) // size if total > 0 else 1
    items = query.offset((page - 1) * size).limit(size).all()

    return PaginatedResponse(
        items=[LoanOut.model_validate(l) for l in items],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )
