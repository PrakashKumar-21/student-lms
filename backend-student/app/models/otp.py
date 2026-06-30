from uuid import uuid4

from sqlalchemy import Column, String, DateTime, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.models.base import Base

class OTP(Base):
    __tablename__ = "otps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    otp_token = Column(String, unique=True, index=True)
    identifier = Column(String, index=True)  # phone or email
    otp_hash = Column(String)
    expires_at = Column(DateTime)
    is_used = Column(Boolean, default=False)
    attempts_remaining = Column(Integer, default=3, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
