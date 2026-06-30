import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class EmailService:
    def __init__(self) -> None:
        if not settings.sendgrid_api_key:
            raise RuntimeError("SENDGRID_API_KEY missing in environment")

        if not settings.sendgrid_from_email:
            raise RuntimeError("SENDGRID_FROM_EMAIL missing in environment")

        self.client = SendGridAPIClient(settings.sendgrid_api_key)

    def send_otp(self, email: str, otp: str) -> None:
        try:
            message = Mail(
                from_email=(
                    settings.sendgrid_from_email,
                    settings.sendgrid_from_name or "Student LMS",
                ),
                to_emails=email,
                subject="Your OTP Code",
                plain_text_content=f"""
Hello,

Your OTP code is: {otp}

This OTP is valid for 5 minutes.
If you did not request this, please ignore this email.

— Student LMS Team
""",
            )

            self.client.send(message)

            logger.info(
                "email_otp_sent",
                extra={"email": email[:2] + "***"},
            )

        except Exception:
            logger.exception("sendgrid_email_send_failed")
            raise


email_service = EmailService()
