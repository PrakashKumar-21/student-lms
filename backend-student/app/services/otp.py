import hashlib
import logging
import secrets
from datetime import datetime, timedelta

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.otp import OTP
from app.services.sms_service import sms_service
from app.services.email_service import email_service

logger = logging.getLogger(__name__)


# Custom Exceptions
class OtpExpiredError(Exception):
    pass


class OtpInvalidError(Exception):
    pass


class OtpAttemptsExceededError(Exception):
    pass


class OtpRateLimitError(Exception):
    pass


# OTP Service
class OtpService:
    OTP_EXPIRY_MINUTES = 5
    MAX_ATTEMPTS = 3

    # Industry limits
    RESEND_COOLDOWN_SECONDS = 30
    MAX_OTPS_PER_WINDOW = 3
    WINDOW_MINUTES = 10

    # Utils
    def _mask_identifier(self, identifier: str) -> str:
        if identifier.isdigit():
            return f"{'*' * 6}{identifier[-4:]}" if len(identifier) >= 4 else "***"
        if "@" in identifier:
            local, domain = identifier.split("@", 1)
            return f"{local[:1]}***@{domain}"
        return "***"

    def _hash_otp(self, otp: str) -> str:
        return hashlib.sha256(otp.encode()).hexdigest()

    # Rate limit checks
    def _enforce_rate_limits(self, identifier: str, db: Session):
        now = datetime.utcnow()

        last_otp = (
            db.query(OTP)
            .filter(OTP.identifier == identifier)
            .order_by(OTP.created_at.desc())
            .first()
        )

        if last_otp and (now - last_otp.created_at).total_seconds() < self.RESEND_COOLDOWN_SECONDS:
            raise OtpRateLimitError("Please wait before requesting another OTP.")

        window_start = now - timedelta(minutes=self.WINDOW_MINUTES)
        otp_count = (
            db.query(OTP)
            .filter(
                OTP.identifier == identifier,
                OTP.created_at >= window_start,
            )
            .count()
        )

        if otp_count >= self.MAX_OTPS_PER_WINDOW:
            raise OtpRateLimitError("Too many OTP requests. Try again later.")

    # Send OTP
    def send_code(self, phone_or_email: str, db: Session) -> str:
        try:
            self._enforce_rate_limits(phone_or_email, db)

            db.query(OTP).filter(
                and_(
                    OTP.identifier == phone_or_email,
                    OTP.is_used == False,
                )
            ).update({"is_used": True})

            otp_code = f"{secrets.randbelow(1000000):06d}"
            otp_token = secrets.token_urlsafe(32)
            otp_hash = self._hash_otp(otp_code)

            expires_at = datetime.utcnow() + timedelta(minutes=self.OTP_EXPIRY_MINUTES)

            otp = OTP(
                otp_token=otp_token,
                identifier=phone_or_email,
                otp_hash=otp_hash,
                expires_at=expires_at,
                is_used=False,
                attempts_remaining=self.MAX_ATTEMPTS,
            )

            db.add(otp)
            db.commit()

        except OtpRateLimitError:
            db.rollback()
            logger.warning(
                "otp_rate_limited",
                extra={"identifier": self._mask_identifier(phone_or_email)},
            )
            raise

        except SQLAlchemyError:
            db.rollback()
            logger.exception(
                "otp_db_error",
                extra={"event": "otp_send", "identifier": self._mask_identifier(phone_or_email)},
            )
            raise

        logger.info(
            "otp_generated",
            extra={"identifier": self._mask_identifier(phone_or_email)},
        )

        
        if phone_or_email.isdigit():
            sms_service.send_otp(phone_or_email, otp_code)
        else:
            email_service.send_otp(phone_or_email, otp_code)

        return otp_token

    # Verify OTP
    def verify_code(self, otp_token: str, code: str, db: Session) -> str:
        try:
            otp = (
                db.query(OTP)
                .filter(
                    OTP.otp_token == otp_token,
                    OTP.is_used == False,
                )
                .first()
            )
        except SQLAlchemyError:
            logger.exception("otp_db_error", extra={"event": "otp_verify"})
            raise

        if not otp:
            raise OtpInvalidError()

        if otp.attempts_remaining <= 0:
            otp.is_used = True
            db.commit()
            raise OtpAttemptsExceededError()

        if otp.expires_at < datetime.utcnow():
            otp.is_used = True
            db.commit()
            raise OtpExpiredError()

        input_hash = self._hash_otp(code)

        if not secrets.compare_digest(input_hash, otp.otp_hash):
            otp.attempts_remaining -= 1
            if otp.attempts_remaining <= 0:
                otp.is_used = True
            db.commit()
            raise OtpInvalidError()

        otp.is_used = True
        db.commit()

        logger.info(
            "otp_verified",
            extra={"identifier": self._mask_identifier(otp.identifier)},
        )

        return otp.identifier


otp_service = OtpService()
