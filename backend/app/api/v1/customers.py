from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from app.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerOut
from app.schemas.pagination import PaginatedResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=PaginatedResponse[CustomerOut])
def list_customers(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=200, description="Items per page"),
    employment: Optional[str] = Query(None, description="Filter by employment status"),
    region: Optional[str] = Query(None, description="Filter by geographic region"),
    min_credit_score: Optional[int] = Query(None, ge=300, le=850),
    max_credit_score: Optional[int] = Query(None, ge=300, le=850),
    search: Optional[str] = Query(None, description="Search by customer name"),
    db: Session = Depends(get_db),
):
    query = db.query(Customer)

    if employment:
        query = query.filter(Customer.employment_status == employment)
    if region:
        query = query.filter(Customer.region == region)
    if min_credit_score:
        query = query.filter(Customer.credit_score >= min_credit_score)
    if max_credit_score:
        query = query.filter(Customer.credit_score <= max_credit_score)
    if search:
        query = query.filter(Customer.name.ilike(f"%{search}%"))

    total = query.count()
    pages = (total + size - 1) // size if total > 0 else 1
    items = query.offset((page - 1) * size).limit(size).all()

    return PaginatedResponse(
        items=[CustomerOut.model_validate(c) for c in items],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )
