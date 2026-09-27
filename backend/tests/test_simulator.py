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


def test_copula_models(db_session):
    # Test Gaussian vs Student's t-copula execution
    res_gauss = run_monte_carlo_vectorized(
        db_session,
        copula_type="gaussian",
        n_sims=300,
        seed=42,
    )
    res_t = run_monte_carlo_vectorized(
        db_session,
        copula_type="student_t",
        degrees_of_freedom=4,
        n_sims=300,
        seed=42,
    )

    assert res_gauss["copula_type"] == "gaussian"
    assert res_t["copula_type"] == "student_t"
    assert res_t["degrees_of_freedom"] == 4
    assert res_gauss["summary"]["expected_loss"] > 0
    assert res_t["summary"]["expected_loss"] > 0


def test_reverse_stress_testing(db_session):
    from app.simulation.monte_carlo import run_reverse_stress_test

    rev_res = run_reverse_stress_test(
        db_session,
        target_metric="car_breach",
        target_value=8.0,
        copula_type="student_t",
        degrees_of_freedom=5,
        n_sims=300,
        actions={
            "capital_injection": 50000000.0,
            "portfolio_derisk_pct": 0.20,
        },
    )

    assert "breaking_shock" in rev_res
    assert "comparison" in rev_res
    assert len(rev_res["comparison"]) >= 4
    assert rev_res["mitigation_status"] in ["RECOVERED", "PARTIALLY_MITIGATED", "INSUFFICIENT_ACTION"]

