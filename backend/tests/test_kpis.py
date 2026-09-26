import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.services.generator_service import seed_database
from app.services.kpi_service import compute_kpis


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

    seed_database(session, n_customers=100)

    yield session
    session.close()


def test_compute_kpis(db_session):
    kpis = compute_kpis(db_session)
    assert kpis["total_customers"] == 100
    assert kpis["total_loans"] > 0
    assert kpis["total_outstanding"] > 0
    assert 0.0 <= kpis["npl_ratio"] <= 100.0
    assert kpis["car"] > 0
