from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, date
import uuid
from app.database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    account_type = Column(String, nullable=False)        # savings / checking / credit_card
    balance = Column(Float, default=0.0, nullable=False)
    opened_at = Column(Date, default=date.today, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    customer = relationship("Customer", back_populates="accounts")

    __table_args__ = (
        Index("idx_accounts_customer_id", "customer_id"),
        Index("idx_accounts_type", "account_type"),
    )

    def __repr__(self):
        return f"<Account(type='{self.account_type}', balance={self.balance})>"
