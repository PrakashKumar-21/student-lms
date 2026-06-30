import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, boards, chat, classes, health, jobs, subjects, subscriptions, users
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.app_name)

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    # allow_origins=origins or ["*"],
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("CORS ORIGINS:", origins)

smtp_enabled = all(
    [
        settings.smtp_host,
        settings.smtp_port,
        settings.smtp_user,
        (settings.smtp_password or "").strip(),
    ]
)
twilio_enabled = all(
    [
        settings.twilio_account_sid,
        settings.twilio_auth_token,
        settings.twilio_phone_number,
    ]
)
logger.info("smtp_configured=%s", smtp_enabled)
logger.info("twilio_configured=%s", twilio_enabled)


app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(health.router)
app.include_router(boards.router, prefix=settings.api_v1_prefix)
app.include_router(classes.router, prefix=settings.api_v1_prefix)
app.include_router(subjects.router, prefix=settings.api_v1_prefix)
app.include_router(jobs.router, prefix=settings.api_v1_prefix)
app.include_router(subscriptions.router, prefix=settings.api_v1_prefix)
app.include_router(chat.router, prefix=settings.api_v1_prefix)
app.include_router(users.router, prefix=settings.api_v1_prefix)
