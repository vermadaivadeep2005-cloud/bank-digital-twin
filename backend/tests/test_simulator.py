import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.services.generator_service import seed_database
from app.simulation.monte_carlo import run_monte_carlo_vectorized


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

    # Seed portfolio with 200 customers
    seed_database(session, n_customers=200)

    yield session
    session.close()


def test_monte_carlo_reproducibility(db_session):
    # Running simulation twice with same seed must yield identical outputs
    res1 = run_monte_carlo_vectorized(
        db_session,
        unemployment_shock=0.05,
        rate_shock=0.02,
        n_sims=500,
        horizon_months=12,
        seed=123,
    )
    res2 = run_monte_carlo_vectorized(
        db_session,
        unemployment_shock=0.05,
        rate_shock=0.02,
        n_sims=500,
        horizon_months=12,
        seed=123,
    )

    assert res1["summary"]["expected_loss"] == pytest.approx(res2["summary"]["expected_loss"], rel=1e-5)
    assert res1["survived_pct"] == res2["survived_pct"]
    assert len(res1["capital_paths"]["p50"]) == 13


def test_monte_carlo_extreme_shock_survival(db_session):
    # Under massive unemployment shock, survival should drop
    res = run_monte_carlo_vectorized(
        db_session,
        unemployment_shock=0.25,
        rate_shock=0.05,
        n_sims=500,
        horizon_months=24,
        seed=42,
    )
    assert "summary" in res
    assert res["summary"]["expected_loss"] > 0
    assert 0.0 <= res["survived_pct"] <= 100.0
