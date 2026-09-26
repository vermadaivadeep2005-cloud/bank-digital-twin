import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sklearn.ensemble import IsolationForest

from app.models.transaction import Transaction
from app.schemas.fraud import FraudScanResult, FraudAlertResponse, FraudTrainResponse

# Global in-memory model instance
_model: Optional[IsolationForest] = None


def get_feature_vector(tx: Transaction, recent_count_1h: int = 1) -> List[float]:
    hour = tx.timestamp.hour if tx.timestamp else 12
    amount = float(tx.amount)
    is_night = 1.0 if 0 <= hour <= 4 else 0.0
    cat_risk = 0.8 if tx.category in ["wire", "crypto", "external"] else (0.5 if tx.category in ["p2p", "retail"] else 0.2)
    return [amount, float(hour), float(recent_count_1h), is_night, cat_risk]


def train_isolation_forest(db: Session) -> FraudTrainResponse:
    global _model
    txs = db.query(Transaction).all()
    
    X = []
    if len(txs) >= 10:
        for tx in txs:
            # Count recent txs for feature
            one_hour_ago = tx.timestamp - timedelta(hours=1) if tx.timestamp else datetime.utcnow() - timedelta(hours=1)
            recent_count = db.query(Transaction).filter(
                Transaction.customer_id == tx.customer_id,
                Transaction.timestamp >= one_hour_ago,
                Transaction.timestamp <= tx.timestamp
            ).count() if tx.customer_id else 1
            X.append(get_feature_vector(tx, recent_count))
    else:
        # Fallback synthetic training matrix
        for _ in range(100):
            amount = float(np.random.exponential(500))
            hour = float(np.random.randint(0, 24))
            velocity = float(np.random.poisson(1))
            is_night = 1.0 if 0 <= hour <= 4 else 0.0
            cat_risk = float(np.random.choice([0.2, 0.5, 0.8]))
            X.append([amount, hour, velocity, is_night, cat_risk])

    X_mat = np.array(X)
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(X_mat)
    _model = model

    return FraudTrainResponse(
        message="IsolationForest anomaly detection model trained successfully",
        trained_samples=len(X_mat),
        contamination=0.05
    )


def evaluate_transaction(tx: Transaction, db: Session) -> FraudScanResult:
    global _model
    if _model is None:
        train_isolation_forest(db)

    # 1. Rule-based triggers
    rule_triggers = []
    amount = float(tx.amount)
    hour = tx.timestamp.hour if tx.timestamp else datetime.utcnow().hour

    # Rule 1: Large amount
    if amount >= 10000.0:
        rule_triggers.append("LARGE_TRANSACTION_AMOUNT (> $10k)")

    # Rule 2: High velocity
    recent_count_5m = 0
    recent_count_1h = 1
    if tx.customer_id and tx.timestamp:
        five_min_ago = tx.timestamp - timedelta(minutes=5)
        one_hour_ago = tx.timestamp - timedelta(hours=1)
        recent_count_5m = db.query(Transaction).filter(
            Transaction.customer_id == tx.customer_id,
            Transaction.timestamp >= five_min_ago,
            Transaction.timestamp <= tx.timestamp
        ).count()
        recent_count_1h = db.query(Transaction).filter(
            Transaction.customer_id == tx.customer_id,
            Transaction.timestamp >= one_hour_ago,
            Transaction.timestamp <= tx.timestamp
        ).count()

    if recent_count_5m >= 5:
        rule_triggers.append("HIGH_VELOCITY (> 5 txns in 5 min)")

    # Rule 3: Midnight wire / transfer
    if 0 <= hour <= 4 and amount >= 2000.0 and tx.type in ["transfer", "withdrawal"]:
        rule_triggers.append("MIDNIGHT_HIGH_VALUE_WIRE")

    # Rule 4: High risk category
    if tx.category in ["wire", "crypto", "external"] and amount >= 5000.0:
        rule_triggers.append("HIGH_RISK_CATEGORY_TRANSFER")

    # 2. ML Anomaly Score
    features = get_feature_vector(tx, recent_count_1h)
    raw_score = float(_model.decision_function([features])[0])  # negative = anomalous
    # Convert raw decision score to 0..1 anomaly likelihood
    ml_anomaly_score = float(np.clip(1.0 / (1.0 + np.exp(raw_score * 5)), 0.0, 1.0))

    # 3. Combined Fraud Score (0-100)
    rule_score = len(rule_triggers) * 30.0
    combined_score = min(100.0, (rule_score * 0.6) + (ml_anomaly_score * 100.0 * 0.4))

    # Determine risk tier
    if combined_score >= 85.0:
        tier = "critical"
    elif combined_score >= 60.0:
        tier = "high"
    elif combined_score >= 30.0:
        tier = "medium"
    else:
        tier = "low"

    # Flag transaction if high/critical
    is_flagged = combined_score >= 60.0
    if is_flagged and not tx.is_flagged:
        tx.is_flagged = True
        db.commit()

    return FraudScanResult(
        transaction_id=tx.id,
        customer_id=tx.customer_id,
        amount=amount,
        type=tx.type,
        category=tx.category,
        timestamp=tx.timestamp,
        rule_triggers=rule_triggers,
        ml_anomaly_score=round(ml_anomaly_score, 4),
        fraud_score=round(combined_score, 2),
        risk_tier=tier,
        is_flagged=is_flagged
    )


def ensure_seed_transactions(db: Session):
    if db.query(Transaction).count() > 0:
        return

    seed_anomaly_batch(db)


def seed_anomaly_batch(db: Session):
    from app.models.customer import Customer
    import uuid

    custs = db.query(Customer).all()
    if not custs:
        for i in range(5):
            c = Customer(
                name=f"Synthetic Customer {i+1}",
                age=35 + i * 5,
                income=65000.0 + i * 10000.0,
                credit_score=680 + i * 20,
                employment_status="employed",
                region="Northeast"
            )
            db.add(c)
        db.commit()
        custs = db.query(Customer).all()

    now = datetime.utcnow()
    for i in range(120):
        c_id = custs[i % len(custs)].id if custs else None

        if i % 8 == 0:  # Large Wire Anomaly
            amount = round(float(np.random.uniform(12000, 75000)), 2)
            cat = "wire"
            tx_type = "transfer"
            tx_time = now - timedelta(minutes=i * 12)
        elif i % 11 == 0:  # Midnight High Value Transfer
            amount = round(float(np.random.uniform(3500, 25000)), 2)
            cat = "external"
            tx_type = "withdrawal"
            tx_time = (now - timedelta(days=i // 5)).replace(hour=2, minute=np.random.randint(10, 50))
        elif i % 7 == 0:  # Crypto Transfer Vector
            amount = round(float(np.random.uniform(5500, 18000)), 2)
            cat = "crypto"
            tx_type = "transfer"
            tx_time = now - timedelta(minutes=i * 5)
        else:  # Normal Retail
            amount = round(float(np.random.uniform(15, 850)), 2)
            cat = str(np.random.choice(["retail", "p2p", "utility"]))
            tx_type = str(np.random.choice(["payment", "transfer"]))
            tx_time = now - timedelta(hours=i * 2)

        tx = Transaction(
            id=uuid.uuid4(),
            customer_id=c_id,
            amount=amount,
            type=tx_type,
            category=cat,
            timestamp=tx_time,
            is_flagged=False
        )
        db.add(tx)

    db.commit()


def scan_transactions(db: Session, limit: int = 50, transaction_id: Optional[UUID] = None) -> List[FraudScanResult]:
    ensure_seed_transactions(db)
    if transaction_id:
        txs = db.query(Transaction).filter(Transaction.id == transaction_id).all()
    else:
        txs = db.query(Transaction).order_by(Transaction.timestamp.desc()).limit(limit).all()

    return [evaluate_transaction(tx, db) for tx in txs]


def get_fraud_alerts(db: Session) -> FraudAlertResponse:
    ensure_seed_transactions(db)
    all_results = scan_transactions(db, limit=200)
    alerts = [r for r in all_results if r.fraud_score >= 30.0 or r.is_flagged]

    if len(alerts) == 0:
        seed_anomaly_batch(db)
        all_results = scan_transactions(db, limit=200)
        alerts = [r for r in all_results if r.fraud_score >= 30.0 or r.is_flagged]

    alerts.sort(key=lambda x: x.fraud_score, reverse=True)

    critical = sum(1 for a in alerts if a.risk_tier == "critical")
    high = sum(1 for a in alerts if a.risk_tier == "high")

    return FraudAlertResponse(
        alerts=alerts,
        total_alerts=len(alerts),
        critical_count=critical,
        high_count=high
    )

