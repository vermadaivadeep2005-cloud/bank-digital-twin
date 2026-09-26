import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.services.generator_service import seed_database
from app.services.transaction_service import generate_transactions, get_transactions, get_transaction_summary
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

    seed_database(session, n_customers=20)

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


def test_transaction_generation_and_summary(db_session):
    txs = generate_transactions(db_session, count=50)
    assert len(txs) == 50

    items, total = get_transactions(db_session, page=1, page_size=20)
    assert total == 50
    assert len(items) == 20

    summary = get_transaction_summary(db_session)
    assert summary["total_count"] == 50
    assert summary["total_volume"] > 0
    assert "deposit" in summary["volume_by_type"] or "withdrawal" in summary["volume_by_type"]


def test_transactions_api_endpoints(client):
    # Generate
    res = client.post("/api/v1/transactions/generate", json={"count": 30})
    assert res.status_code == 200
    assert res.json()["generated_count"] == 30

    # List
    res = client.get("/api/v1/transactions?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 30
    assert len(data["items"]) == 10

    # Summary
    res = client.get("/api/v1/transactions/summary")
    assert res.status_code == 200
    summary = res.json()
    assert summary["total_count"] == 30
