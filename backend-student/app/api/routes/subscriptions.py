from datetime import datetime, timedelta, timezone
from uuid import UUID

import razorpay
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db, get_current_user
from app.core.config import get_settings
from app.schemas.subscription import (
    ActivateSubscription,
    SubscriptionCheckoutRequest,
    SubscriptionCheckoutResponse,
    SubscriptionPlanCreate,
    SubscriptionPlanOut,
    SubscriptionPlanUpdate,
    SubscriptionVerifyRequest,
)
from app.models.subscription import SubscriptionPlan, UserSubscription
from app.models.user import User

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])
settings = get_settings()


def _deactivate_existing_subscriptions(db: Session, user_id: UUID) -> None:
    now = datetime.now(timezone.utc)
    (
        db.query(UserSubscription)
        .filter(UserSubscription.user_id == user_id)
        .filter(UserSubscription.status == "active")
        .update(
            {
                UserSubscription.status: "cancelled",
                UserSubscription.cancelled_at: now,
            }
        )
    )
    db.flush()

def _calculate_carryover_seconds(
    db: Session,
    user_id: UUID,
) -> int:
    latest = (
        db.query(UserSubscription)
        .filter(UserSubscription.user_id == user_id)
        .order_by(UserSubscription.started_at.desc())
        .first()
    )
    if not latest or latest.status != "active":
        return 0
    if latest.expires_at is None:
        return 0
    now = datetime.now(timezone.utc)
    expires_at = latest.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    remaining = (expires_at - now).total_seconds()
    if remaining <= 0:
        return 0
    return int(remaining)


@router.get("/plans", response_model=list[SubscriptionPlanOut])
def list_plans(db: Session = Depends(get_db)) -> list[SubscriptionPlanOut]:
    plans = db.query(SubscriptionPlan).order_by(SubscriptionPlan.name).all()
    return [SubscriptionPlanOut.model_validate(plan) for plan in plans]


@router.post(
    "/plans",
    response_model=SubscriptionPlanOut,
    status_code=status.HTTP_201_CREATED,
)
def create_plan(
    payload: SubscriptionPlanCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> SubscriptionPlanOut:
    if payload.amount_paise < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="amount_paise must be zero or greater.",
        )
    if payload.max_queries_per_day is not None and payload.max_queries_per_day <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="max_queries_per_day must be greater than 0.",
        )
    if payload.max_queries_per_month is not None and payload.max_queries_per_month <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="max_queries_per_month must be greater than 0.",
        )
    existing = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Subscription plan already exists.",
        )
    plan = SubscriptionPlan(
        name=payload.name.strip(),
        price=payload.price.strip(),
        description=(payload.description or "").strip(),
        features=payload.features,
        amount_paise=payload.amount_paise,
        currency=payload.currency.strip(),
        interval=payload.interval.strip(),
        max_queries_per_day=payload.max_queries_per_day,
        max_queries_per_month=payload.max_queries_per_month,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return SubscriptionPlanOut.model_validate(plan)


@router.put("/plans/{plan_id}", response_model=SubscriptionPlanOut)
def update_plan(
    plan_id: UUID,
    payload: SubscriptionPlanUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> SubscriptionPlanOut:
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")
    if payload.name is not None:
        plan.name = payload.name.strip()
    if payload.price is not None:
        plan.price = payload.price.strip()
    if payload.description is not None:
        plan.description = payload.description.strip()
    if payload.features is not None:
        plan.features = payload.features
    if payload.amount_paise is not None:
        if payload.amount_paise < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="amount_paise must be zero or greater.",
            )
        plan.amount_paise = payload.amount_paise
    if payload.currency is not None:
        plan.currency = payload.currency.strip()
    if payload.interval is not None:
        plan.interval = payload.interval.strip()
    if payload.max_queries_per_day is not None:
        if payload.max_queries_per_day <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="max_queries_per_day must be greater than 0.",
            )
        plan.max_queries_per_day = payload.max_queries_per_day
    if payload.max_queries_per_month is not None:
        if payload.max_queries_per_month <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="max_queries_per_month must be greater than 0.",
            )
        plan.max_queries_per_month = payload.max_queries_per_month
    db.commit()
    db.refresh(plan)
    return SubscriptionPlanOut.model_validate(plan)


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(
    plan_id: UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
) -> None:
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")
    db.delete(plan)
    db.commit()
    return None


@router.post("/activate")
def activate_plan(
    payload: ActivateSubscription,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> dict:
    plan = None
    if payload.plan_id:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == payload.plan_id).first()
    if not plan and payload.plan_name:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == payload.plan_name).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found.",
        )

    expires_at = None
    carryover_seconds = _calculate_carryover_seconds(db, user.id)
    if plan.amount_paise == 0:
        base_expiry = datetime.now(timezone.utc) + timedelta(days=3)
        if carryover_seconds:
            base_expiry += timedelta(seconds=carryover_seconds)
        expires_at = base_expiry
    _deactivate_existing_subscriptions(db, user.id)
    subscription = UserSubscription(
        user_id=user.id,
        plan_id=plan.id,
        status="active",
        expires_at=expires_at,
        price_at_purchase=plan.price,
        payment_method="free" if plan.amount_paise == 0 else None,
    )
    db.add(subscription)
    db.commit()
    return {"status": "active", "plan": plan.name}


@router.post("/checkout", response_model=SubscriptionCheckoutResponse)
def create_checkout(
    payload: SubscriptionCheckoutRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> SubscriptionCheckoutResponse:
    _ = user
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay keys are not configured.",
        )
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == payload.plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")
    if plan.amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plan amount is not set.",
        )
    client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))

    receipt = f"sub_{str(payload.plan_id)[:8]}_{int(datetime.utcnow().timestamp())}"

    order = client.order.create(
        {
            "amount": plan.amount_paise,
            "currency": plan.currency,
            "receipt": receipt,
            "payment_capture": 1,
        }
    )

    return SubscriptionCheckoutResponse(
        order_id=order["id"],
        amount=plan.amount_paise,
        currency=plan.currency,
        key_id=settings.razorpay_key_id,
    )


@router.post("/verify")
def verify_payment(
    payload: SubscriptionVerifyRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> dict:
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay keys are not configured.",
        )
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == payload.plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")
    client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": payload.order_id,
                "razorpay_payment_id": payload.payment_id,
                "razorpay_signature": payload.signature,
            }
        )
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed.",
        )

    expires_at = None
    interval = (plan.interval or "month").lower()
    if interval == "year":
        base_expiry = datetime.now(timezone.utc) + timedelta(days=365)
    elif interval == "month":
        base_expiry = datetime.now(timezone.utc) + timedelta(days=30)
    else:
        base_expiry = datetime.now(timezone.utc) + timedelta(days=30)

    carryover_seconds = _calculate_carryover_seconds(db, user.id)
    if carryover_seconds:
        base_expiry += timedelta(seconds=carryover_seconds)
    expires_at = base_expiry

    _deactivate_existing_subscriptions(db, user.id)
    subscription = UserSubscription(
        user_id=user.id,
        plan_id=plan.id,
        status="active",
        expires_at=expires_at,
        price_at_purchase=plan.price,
        payment_method="razorpay",
        payment_ref_id=payload.payment_id,
        provider="razorpay",
        provider_subscription_id=payload.order_id,
    )
    db.add(subscription)
    db.commit()
    return {"status": "active", "plan_id": str(plan.id)}
