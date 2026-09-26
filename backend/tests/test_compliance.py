import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.services.generator_service import seed_database
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


def test_compliance_report_endpoint(client):
    res = client.get("/api/v1/compliance/report")
    assert res.status_code == 200
    data = res.json()

    assert data["overall_status"] in ["PASS", "WARNING", "BREACH"]
    assert data["total_metrics"] >= 5
    assert len(data["matrix"]) >= 5


def test_compliance_gaps_endpoint(client):
    res = client.get("/api/v1/compliance/gaps")
    assert res.status_code == 200
    data = res.json()

    assert "gaps_count" in data
    assert "gaps" in data


def test_compliance_stress_check_endpoint(client):
    res = client.post("/api/v1/compliance/stress-check", json={
        "unemployment_shock": 0.20,
        "rate_shock": 0.05
    })
    assert res.status_code == 200
    matrix = res.json()
    assert isinstance(matrix, list)
    assert len(matrix) >= 5
