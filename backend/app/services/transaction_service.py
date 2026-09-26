import random
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.transaction import Transaction
from app.models.customer import Customer
from app.models.account import Account


TYPES = ["deposit", "withdrawal", "transfer", "loan_payment"]
CATEGORIES = {
    "deposit": ["salary", "wire", "refund", "investment"],
    "withdrawal": ["atm", "cash", "retail", "utilities"],
    "transfer": ["p2p", "internal", "wire", "external"],
    "loan_payment": ["mortgage", "auto_loan", "personal_loan", "business_loan"]
}
MERCHANTS = [
    "Amazon.com", "Walmart", "Target", "Starbucks", "Shell Oil",
    "Netflix", "Apple Store", "Uber", "Consolidated Edison", "Chase Wire Service"
]
LOCATIONS = ["New York, NY", "Chicago, IL", "Houston, TX", "Los Angeles, CA", "Miami, FL", "London, UK", "Tokyo, JP"]


def generate_transactions(db: Session, count: int = 100) -> List[Transaction]:
    customers = db.query(Customer).all()
    accounts = db.query(Account).all()

    cust_ids = [c.id for c in customers]
    acc_ids = [a.id for a in accounts]

    created = []
    now = datetime.utcnow()

    for i in range(count):
        cust_id = random.choice(cust_ids) if cust_ids else None
        acc_id = random.choice(acc_ids) if acc_ids else None
        tx_type = random.choices(TYPES, weights=[0.35, 0.40, 0.15, 0.10])[0]
        category = random.choice(CATEGORIES[tx_type])
        
        # Base amounts
        if tx_type == "deposit":
            amount = round(random.uniform(50.0, 5000.0), 2)
        elif tx_type == "withdrawal":
            amount = round(random.uniform(5.0, 1500.0), 2)
        elif tx_type == "transfer":
            amount = round(random.uniform(20.0, 3000.0), 2)
        else:
            amount = round(random.uniform(200.0, 2500.0), 2)

        # Flagged anomalies (~5% of transactions)
        is_flagged = False
        if random.random() < 0.05:
            is_flagged = True
            amount = round(random.uniform(10500.0, 75000.0), 2)

        timestamp = now - timedelta(minutes=random.randint(1, 43200))
        merchant = random.choice(MERCHANTS) if tx_type in ["withdrawal", "deposit"] else None
        location = random.choice(LOCATIONS)

        tx = Transaction(
            customer_id=cust_id,
            account_id=acc_id,
            amount=amount,
            type=tx_type,
            category=category,
            timestamp=timestamp,
            merchant=merchant,
            location=location,
            is_flagged=is_flagged
        )
        db.add(tx)
        created.append(tx)

    db.commit()
    for tx in created:
        db.refresh(tx)

    return created


def get_transactions(
    db: Session,
    page: int = 1,
    page_size: int = 50,
    customer_id: Optional[UUID] = None,
    account_id: Optional[UUID] = None,
    is_flagged: Optional[bool] = None,
    tx_type: Optional[str] = None,
) -> Tuple[List[Transaction], int]:
    query = db.query(Transaction)

    if customer_id:
        query = query.filter(Transaction.customer_id == customer_id)
    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    if is_flagged is not None:
        query = query.filter(Transaction.is_flagged == is_flagged)
    if tx_type:
        query = query.filter(Transaction.type == tx_type)

    total = query.count()
    items = query.order_by(Transaction.timestamp.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_transaction_summary(db: Session) -> Dict:
    total_count = db.query(Transaction).count()
    if total_count == 0:
        return {
            "total_count": 0,
            "total_volume": 0.0,
            "flagged_count": 0,
            "volume_by_type": {},
            "volume_by_category": {}
        }

    total_volume = db.query(func.sum(Transaction.amount)).scalar() or 0.0
    flagged_count = db.query(Transaction).filter(Transaction.is_flagged == True).count()

    type_rows = db.query(Transaction.type, func.sum(Transaction.amount)).group_by(Transaction.type).all()
    volume_by_type = {row[0]: float(row[1] or 0.0) for row in type_rows}

    cat_rows = db.query(Transaction.category, func.sum(Transaction.amount)).group_by(Transaction.category).all()
    volume_by_category = {row[0]: float(row[1] or 0.0) for row in cat_rows}

    return {
        "total_count": total_count,
        "total_volume": float(total_volume),
        "flagged_count": flagged_count,
        "volume_by_type": volume_by_type,
        "volume_by_category": volume_by_category
    }
