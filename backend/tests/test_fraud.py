import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from datetime import datetime

from app.database import Base, get_db
from app.models.transaction import Transaction
from app.services.fraud_service import train_isolation_forest, scan_transactions, get_fraud_alerts
from app.main import app


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def client(db_session):
    def _get_db_override():
        return db_session

    app.dependency_overrides[get_db] = _get_db_override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_fraud_rule_triggers(db_session):
    # Create large transaction
    t1 = Transaction(
        amount=15000.0,
        type="withdrawal",
        category="retail",
        timestamp=datetime(2026, 1, 1, 14, 0, 0),
        is_flagged=False
    )
    # Create midnight wire
    t2 = Transaction(
        amount=3000.0,
        type="transfer",
        category="wire",
        timestamp=datetime(2026, 1, 1, 2, 30, 0),
        is_flagged=False
    )
    db_session.add_all([t1, t2])
    db_session.commit()

    results = scan_transactions(db_session, limit=10)
    assert len(results) == 2

    # Verify rule triggers
    t1_res = next(r for r in results if r.transaction_id == t1.id)
    assert "LARGE_TRANSACTION_AMOUNT (> $10k)" in t1_res.rule_triggers

    t2_res = next(r for r in results if r.transaction_id == t2.id)
    assert "MIDNIGHT_HIGH_VALUE_WIRE" in t2_res.rule_triggers


def test_fraud_api_endpoints(client, db_session):
    t1 = Transaction(
        amount=25000.0,
        type="transfer",
        category="wire",
        timestamp=datetime(2026, 1, 1, 1, 0, 0),
        is_flagged=False
    )
    db_session.add(t1)
    db_session.commit()

    # Train endpoint
    res_train = client.post("/api/v1/fraud/train")
    assert res_train.status_code == 200
    assert "trained_samples" in res_train.json()

    # Scan endpoint
    res_scan = client.post("/api/v1/fraud/scan", json={"limit": 10})
    assert res_scan.status_code == 200
    scan_list = res_scan.json()
    assert len(scan_list) >= 1

    # Alerts endpoint
    res_alerts = client.get("/api/v1/fraud/alerts")
    assert res_alerts.status_code == 200
    alerts_data = res_alerts.json()
    assert alerts_data["total_alerts"] >= 1
