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


def test_what_if_simulation_endpoint(client):
    res = client.post("/api/v1/what-if/simulate", json={
        "unemployment_shock": 0.15,
        "rate_shock": 0.04,
        "property_price_drop": 0.25,
        "deposit_outflow_pct": 0.20
    })
    assert res.status_code == 200
    data = res.json()

    assert data["post_stress_car"] < data["baseline_car"]
    assert data["post_stress_npl"] > data["baseline_npl"]
    assert data["estimated_losses"] > 0
    assert data["risk_level"] in ["Low", "Medium", "High", "Critical"]


def test_what_if_sensitivity_endpoint(client):
    res = client.get("/api/v1/what-if/sensitivity")
    assert res.status_code == 200
    data = res.json()

    assert "baseline_car" in data
    assert len(data["sensitivities"]) == 4
