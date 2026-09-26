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


def test_forecast_endpoint_and_confidence_bounds(client):
    res1 = client.get("/api/v1/forecasts?metric=car&horizon=30")
    assert res1.status_code == 200
    data1 = res1.json()

    assert data1["metric"] == "car"
    assert data1["horizon_days"] == 30
    assert len(data1["forecast"]) == 30
    assert data1["cached"] is False

    # Check confidence bounds ordering
    p0 = data1["forecast"][0]
    assert p0["lower_95"] <= p0["lower_80"] <= p0["value"] <= p0["upper_80"] <= p0["upper_95"]

    # Test cache on second call
    res2 = client.get("/api/v1/forecasts?metric=car&horizon=30")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["cached"] is True


def test_forecast_horizons_and_metrics(client):
    for metric in ["npl_ratio", "deposits", "liquidity_ratio"]:
        res = client.get(f"/api/v1/forecasts?metric={metric}&horizon=90")
        assert res.status_code == 200
        data = res.json()
        assert data["metric"] == metric
        assert data["horizon_days"] == 90
        assert len(data["forecast"]) == 90
