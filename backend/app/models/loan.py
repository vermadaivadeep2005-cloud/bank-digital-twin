from sqlalchemy import Column, String, Float, Integer, Date, DateTime, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, date
import uuid
from app.database import Base


class Loan(Base):
    __tablename__ = "loans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    principal = Column(Float, nullable=False)
    outstanding = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)
    term_months = Column(Integer, nullable=False)
    loan_type = Column(String, nullable=False)           # mortgage / personal / auto / business
    status = Column(String, default="current", nullable=False)  # current / delinquent / default
    origination_date = Column(Date, default=date.today, nullable=False)
    region = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer = relationship("Customer", back_populates="loans")

    __table_args__ = (
        CheckConstraint("principal > 0", name="chk_loan_principal_positive"),
        CheckConstraint("outstanding >= 0", name="chk_loan_outstanding_nonnegative"),
        CheckConstraint("interest_rate > 0", name="chk_loan_interest_positive"),
        CheckConstraint("term_months > 0", name="chk_loan_term_positive"),
        Index("idx_loans_customer_id", "customer_id"),
        Index("idx_loans_status", "status"),
        Index("idx_loans_region", "region"),
        Index("idx_loans_type", "loan_type"),
    )

    def __repr__(self):
        return f"<Loan(type='{self.loan_type}', outstanding={self.outstanding}, status='{self.status}')>"
