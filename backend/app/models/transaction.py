from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=True)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)        # deposit / withdrawal / transfer / loan_payment
    category = Column(String, nullable=False)    # retail / utilities / salary / wire / online_shopping / entertainment
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    merchant = Column(String, nullable=True)
    location = Column(String, nullable=True)
    is_flagged = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        Index("idx_tx_customer_id", "customer_id"),
        Index("idx_tx_account_id", "account_id"),
        Index("idx_tx_timestamp", "timestamp"),
        Index("idx_tx_is_flagged", "is_flagged"),
        Index("idx_tx_type", "type"),
    )

    def __repr__(self):
        return f"<Transaction(type='{self.type}', amount={self.amount}, is_flagged={self.is_flagged})>"
