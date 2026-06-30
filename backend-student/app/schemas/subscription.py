from uuid import UUID

from pydantic import BaseModel, Field


class SubscriptionPlanOut(BaseModel):
    id: UUID
    name: str
    price: str
    description: str
    features: list[str] = Field(default_factory=list)
    amount_paise: int
    currency: str
    interval: str
    max_queries_per_day: int | None = None
    max_queries_per_month: int | None = None

    model_config = {"from_attributes": True}


class SubscriptionPlanCreate(BaseModel):
    name: str
    price: str
    description: str | None = None
    features: list[str] = Field(default_factory=list)
    amount_paise: int
    currency: str = "INR"
    interval: str = "month"
    max_queries_per_day: int | None = None
    max_queries_per_month: int | None = None


class SubscriptionPlanUpdate(BaseModel):
    name: str | None = None
    price: str | None = None
    description: str | None = None
    features: list[str] | None = None
    amount_paise: int | None = None
    currency: str | None = None
    interval: str | None = None
    max_queries_per_day: int | None = None
    max_queries_per_month: int | None = None


class SubscriptionCheckoutRequest(BaseModel):
    plan_id: UUID


class SubscriptionCheckoutResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str


class SubscriptionVerifyRequest(BaseModel):
    plan_id: UUID
    order_id: str
    payment_id: str
    signature: str


class ActivateSubscription(BaseModel):
    plan_id: UUID | None = None
    plan_name: str | None = None
