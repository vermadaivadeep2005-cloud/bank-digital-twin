from sqlalchemy import Column, String, JSON, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base


class StressRun(Base):
    __tablename__ = "stress_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scenario_name = Column(String, nullable=False)
    params = Column(JSON, nullable=False)
    results = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_stress_runs_created_at", "created_at"),
    )

    def __repr__(self):
        return f"<StressRun(scenario='{self.scenario_name}', created_at='{self.created_at}')>"
