import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.database import Base, get_db

# Import models so SQLAlchemy metadata registers all tables
from app.models.user import User
from app.models.customer import Customer
from app.models.loan import Loan
from app.models.account import Account
from app.models.stress_run import StressRun

from sqlalchemy.pool import StaticPool

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

from app.main import app


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_register_and_login_user():
    # 1. Register User
    reg_payload = {
        "email": "testanalyst@banktwin.com",
        "password": "SecurePassword123!",
        "full_name": "Test Analyst",
        "role": "analyst",
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "testanalyst@banktwin.com"

    # 2. Login User
    login_payload = {
        "email": "testanalyst@banktwin.com",
        "password": "SecurePassword123!",
    }
    login_res = client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 3. Get Current User Profile (/me)
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "testanalyst@banktwin.com"
