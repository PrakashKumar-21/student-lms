import logging
from twilio.rest import Client

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SmsService:
    def __init__(self) -> None:
        # Safety check (industry practice)
        if not all(
            [
                settings.twilio_account_sid,
                settings.twilio_auth_token,
                settings.twilio_phone_number,
            ]
        ):
            raise RuntimeError(
                "Twilio settings missing. Check TWILIO_ACCOUNT_SID, "
                "TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER."
            )
        if not settings.twilio_phone_number.startswith("+"):
            raise RuntimeError(
                "TWILIO_PHONE_NUMBER must be a real SMS-capable E.164 number "
                "starting with '+'."
            )
        if settings.twilio_phone_number.startswith(("MG", "VA")):
            raise RuntimeError(
                "TWILIO_PHONE_NUMBER must be a real phone number, "
                "not a Messaging Service SID (MG...) or a Verification SID (VA...)."
            )

        self.client = Client(
            settings.twilio_account_sid,
            settings.twilio_auth_token,
        )

    def send_otp(self, phone: str, otp: str) -> None:
        """
        Send OTP via SMS using Twilio
        Phone must be in E.164 format (e.g. +91XXXXXXXXXX)
        """
        try:
            self.client.messages.create(
                body=f"Your OTP is {otp}. It expires in 5 minutes.",
                from_=settings.twilio_phone_number,
                to=phone,
            )

            logger.info(
                "sms_otp_sent",
                extra={"phone": f"******{phone[-4:]}"}
            )

        except Exception:
            logger.exception("sms_send_failed")
            raise


sms_service = SmsService()
