from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.api.deps import get_current_admin, get_db
from app.core.config import get_settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import (
    AdminLogin,
    AdminProfile,
    AdminToken,
    OtpRequest,
    OtpResponse,
    OtpVerify,
    TokenWithUser,
)
from app.services.otp import (
    OtpAttemptsExceededError,
    OtpExpiredError,
    OtpInvalidError,
    otp_service,
)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/request-otp", response_model=OtpResponse)
def request_otp(payload: OtpRequest, db: Session = Depends(get_db)) -> OtpResponse:
    try:
        otp_token = otp_service.send_code(payload.phone_or_email, db)
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not send OTP. Please try again later.",
        )
    return OtpResponse(otp_token=otp_token, message="OTP sent")


@router.post("/verify-otp", response_model=TokenWithUser)
def verify_otp(payload: OtpVerify, db: Session = Depends(get_db)) -> TokenWithUser:
    try:
        phone_or_email = otp_service.verify_code(payload.otp_token, payload.code, db)
    except OtpExpiredError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired, please request again",
        )
    except OtpAttemptsExceededError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP attempts exceeded, please request again",
        )
    except OtpInvalidError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not verify OTP. Please try again later.",
        )

    user = db.query(User).filter(User.phone_or_email == phone_or_email).first()
    is_new_user = False
    if not user:
        user = User(phone_or_email=phone_or_email, role="student")
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True

    token = create_access_token(subject=str(user.id))
    return TokenWithUser(access_token=token, user_id=user.id, is_new_user=is_new_user)


@router.post("/admin/login", response_model=AdminToken)
def admin_login(payload: AdminLogin, db: Session = Depends(get_db)) -> AdminToken:
    email = payload.email.strip().lower()
    password = payload.password.strip()
    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required.",
        )

    admin_user = db.query(User).filter(User.phone_or_email == email).first()
    if not admin_user and settings.admin_email and settings.admin_password:
        if email == settings.admin_email.lower():
            admin_user = User(
                phone_or_email=email,
                role="admin",
                password_hash=get_password_hash(settings.admin_password),
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

    if not admin_user or admin_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials.",
        )
    if not admin_user.password_hash or not verify_password(
        password, admin_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials.",
        )

    token = create_access_token(subject=str(admin_user.id))
    return AdminToken(access_token=token, user_id=admin_user.id, role=admin_user.role)


@router.get("/admin/me", response_model=AdminProfile)
def admin_me(admin: User = Depends(get_current_admin)) -> AdminProfile:
    return AdminProfile(
        user_id=admin.id,
        email=admin.phone_or_email,
        role=admin.role,
    )

