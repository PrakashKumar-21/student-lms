from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.models.base import Base


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    name = Column(String(80), unique=True, nullable=False)
    price = Column(String(40), nullable=False)
    description = Column(String(255), nullable=True)
    features = Column(JSONB, nullable=False, default=list)
    amount_paise = Column(Integer, nullable=False, default=0)
    currency = Column(String(10), nullable=False, default="INR")
    interval = Column(String(20), nullable=False, default="month")
    max_queries_per_day = Column(Integer, nullable=True)
    max_queries_per_month = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=False)
    status = Column(String(40), default="active")
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    price_at_purchase = Column(String(40), nullable=True)
    payment_method = Column(String(20), nullable=True)
    payment_ref_id = Column(String(120), nullable=True)
    provider = Column(String(40), nullable=True)
    provider_subscription_id = Column(String(120), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User")
    plan = relationship("SubscriptionPlan")
