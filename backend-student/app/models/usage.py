from uuid import uuid4

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class UserUsage(Base):
    __tablename__ = "user_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    period_date = Column(Date, nullable=False, index=True)
    queries_used = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())