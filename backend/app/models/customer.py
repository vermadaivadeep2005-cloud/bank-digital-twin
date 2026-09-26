from sqlalchemy import Column, Integer, String, Float, DateTime, CheckConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    income = Column(Float, nullable=False)
    credit_score = Column(Integer, nullable=False)
    employment_status = Column(String, nullable=False)   # employed / self-employed / unemployed / retired
    region = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    accounts = relationship("Account", back_populates="customer", cascade="all, delete-orphan")
    loans = relationship("Loan", back_populates="customer", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("credit_score >= 300 AND credit_score <= 850", name="chk_credit_score_range"),
        CheckConstraint("age >= 18 AND age <= 120", name="chk_age_range"),
        CheckConstraint("income >= 0", name="chk_income_positive"),
        Index("idx_customers_employment", "employment_status"),
        Index("idx_customers_region", "region"),
        Index("idx_customers_credit_score", "credit_score"),
    )

    def __repr__(self):
        return f"<Customer(name='{self.name}', credit_score={self.credit_score}, region='{self.region}')>"
