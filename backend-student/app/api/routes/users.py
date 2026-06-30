from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.subscription import SubscriptionPlan, UserSubscription

from app.api.deps import get_current_user, get_current_user_optional
from app.core.config import get_settings
from app.models.user import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/users", tags=["users"])
settings = get_settings()


@router.get("/me", response_model=UserOut)
def read_me(user=Depends(get_current_user)) -> UserOut:
    return UserOut(id=user.id, phone_or_email=user.phone_or_email, full_name=user.full_name)


@router.get("", response_model=list[dict])
def list_users(
    db: Session = Depends(get_db),
    _user=Depends(get_current_user_optional),
) -> list[dict]:
    if settings.allow_admin_readonly:
        _user = _user
    elif not _user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    elif _user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    now = datetime.now(timezone.utc)
    users = db.query(User).order_by(User.phone_or_email.asc()).all()
    result = []
    for user in users:
        subscription = (
            db.query(UserSubscription)
            .filter(UserSubscription.user_id == user.id)
            .order_by(UserSubscription.started_at.desc())
            .first()
        )
        plan = None
        if subscription:
            plan = (
                db.query(SubscriptionPlan)
                .filter(SubscriptionPlan.id == subscription.plan_id)
                .first()
            )
        effective_status = "none"
        expires_at = None
        if subscription:
            expires_at = subscription.expires_at
            if expires_at and expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if subscription.status == "active" and expires_at and expires_at <= now:
                effective_status = "expired"
            else:
                effective_status = subscription.status or "none"

        result.append(
            {
                "id": str(user.id),
                "phone_or_email": user.phone_or_email,
                "full_name": user.full_name,
                "subscription": {
                    "plan_id": str(plan.id) if plan else None,
                    "plan_name": plan.name if plan else None,
                    "status": effective_status,
                    "expires_at": expires_at,
                    "is_active": bool(
                        subscription
                        and effective_status == "active"
                        and (expires_at is None or expires_at > now)
                    ),
                },
            }
        )
    return result
