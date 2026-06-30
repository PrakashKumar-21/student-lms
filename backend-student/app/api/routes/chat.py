from datetime import date

import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import get_settings
from app.models.chat import ChatMessage, ChatSession
from app.models.subscription import UserSubscription
from app.models.usage import UserUsage
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag import generate_reply
from datetime import datetime, timezone




router = APIRouter(prefix="/chat", tags=["chat"])
settings = get_settings()
logger = logging.getLogger("uvicorn.error")
STALE_LOCK_SECONDS = 120

def _sse_event(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n"

def _chunk_reply(text: str) -> list[str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if lines:
        return [line + "\n" for line in lines]
    chunk_size = 120
    return [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]


def _release_stale_lock(db: Session, session_id: str) -> None:
    session_row = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session_row or not session_row.is_processing:
        return
    latest_message = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .first()
    )
    reference_time = latest_message.created_at if latest_message else session_row.created_at
    if reference_time and reference_time.tzinfo is None:
        reference_time = reference_time.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    if reference_time and (now - reference_time).total_seconds() > STALE_LOCK_SECONDS:
        db.query(ChatSession).filter(ChatSession.id == session_id).update(
            {ChatSession.is_processing: False}
        )
        db.commit()

@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
) -> ChatResponse:
    if not user and not settings.allow_chat_without_subscription:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
    active_subscription = None
    if user:
        latest_subscription = (
            db.query(UserSubscription)
            .filter(UserSubscription.user_id == user.id)
            .order_by(UserSubscription.started_at.desc())
            .first()
        )
        now = datetime.now(timezone.utc)
        expires_at = latest_subscription.expires_at
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if (
            not latest_subscription
            or latest_subscription.status != "active"
            or (expires_at is not None and expires_at <= now)
        ):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Subscription expired or inactive.",
            )
        active_subscription = latest_subscription

    usage = None
    if user:
        plan = active_subscription.plan
        # today = date.today()
        today = datetime.now(timezone.utc).date()
        usage = (
            db.query(UserUsage)
            .filter(UserUsage.user_id == user.id, UserUsage.period_date == today)
            .first()
        )
        if not usage:
            usage = UserUsage(user_id=user.id, period_date=today, queries_used=0)
            db.add(usage)
            db.flush()
        if plan.max_queries_per_day is not None and usage.queries_used >= plan.max_queries_per_day:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Daily query limit reached.",
            )
        if plan.max_queries_per_month is not None:
            month_start = today.replace(day=1)
            month_total = (
                db.query(func.coalesce(func.sum(UserUsage.queries_used), 0))
                .filter(UserUsage.user_id == user.id)
                .filter(UserUsage.period_date >= month_start)
                .scalar()
            )
            if month_total >= plan.max_queries_per_month:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Monthly query limit reached.",
                )
    session = None
    if payload.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == payload.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

    if not session:
        session = ChatSession(
            user_id=user.id if user else None,
            board=payload.board,
            class_level=payload.class_level,
            subject=payload.subject,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    _release_stale_lock(db, str(session.id))

    lock_acquired = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session.id,
            ChatSession.is_processing.is_(False),
        )
        .update({ChatSession.is_processing: True})
    )
    db.commit()
    if lock_acquired == 0:
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    try:
        db.add(
            ChatMessage(session_id=session.id, sender="user", content=payload.message)
        )
        reply, citations = generate_reply(
            db,
            payload.message,
            payload.subject_id,
            payload.board,
            payload.class_level,
            payload.subject,
        )
        # db.add(ChatMessage(session_id=session.id, sender="bot", content=reply))
        if usage:
            usage.queries_used += 1
        db.commit()

        return ChatResponse(session_id=session.id, reply=reply, citations=citations)
    finally:
        db.query(ChatSession).filter(ChatSession.id == session.id).update(
            {ChatSession.is_processing: False}
        )
        db.commit()


@router.post("/stream")
def chat_stream(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if not user and not settings.allow_chat_without_subscription:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    active_subscription = None
    if user:
        latest_subscription = (
            db.query(UserSubscription)
            .filter(UserSubscription.user_id == user.id)
            .order_by(UserSubscription.started_at.desc())
            .first()
        )
        now = datetime.now(timezone.utc)
        expires_at = latest_subscription.expires_at if latest_subscription else None
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if (
            not latest_subscription
            or latest_subscription.status != "active"
            or (expires_at is not None and expires_at <= now)
        ):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Subscription expired or inactive.",
            )
        active_subscription = latest_subscription

    usage = None
    if user:
        plan = active_subscription.plan
        today = datetime.now(timezone.utc).date()
        usage = (
            db.query(UserUsage)
            .filter(UserUsage.user_id == user.id, UserUsage.period_date == today)
            .first()
        )
        if not usage:
            usage = UserUsage(user_id=user.id, period_date=today, queries_used=0)
            db.add(usage)
            db.flush()
        if plan.max_queries_per_day is not None and usage.queries_used >= plan.max_queries_per_day:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Daily query limit reached.",
            )
        if plan.max_queries_per_month is not None:
            month_start = today.replace(day=1)
            month_total = (
                db.query(func.coalesce(func.sum(UserUsage.queries_used), 0))
                .filter(UserUsage.user_id == user.id)
                .filter(UserUsage.period_date >= month_start)
                .scalar()
            )
            if month_total >= plan.max_queries_per_month:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Monthly query limit reached.",
                )

    session = None
    if payload.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == payload.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

    if not session:
        session = ChatSession(
            user_id=user.id if user else None,
            board=payload.board,
            class_level=payload.class_level,
            subject=payload.subject,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    _release_stale_lock(db, str(session.id))

    lock_acquired = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session.id,
            ChatSession.is_processing.is_(False),
        )
        .update({ChatSession.is_processing: True})
    )
    db.commit()
    if lock_acquired == 0:
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    session_id_str = str(session.id)

    usage_id = usage.id if usage else None

    def event_stream():
        try:
            yield _sse_event("session", {"session_id": session_id_str})
            db.add(
                ChatMessage(session_id=session.id, sender="user", content=payload.message)
            )
            reply, citations = generate_reply(
                db,
                payload.message,
                payload.subject_id,
                payload.board,
                payload.class_level,
                payload.subject,
            )
            if usage_id:
                db.query(UserUsage).filter(UserUsage.id == usage_id).update(
                    {UserUsage.queries_used: UserUsage.queries_used + 1}
                )
            db.commit()

            for chunk in _chunk_reply(reply):
                yield _sse_event("chunk", {"text": chunk})

            yield _sse_event("done", {"citations": citations})
        except Exception as exc:
            logger.exception("SSE chat stream failed")
            yield _sse_event("error", {"detail": str(exc)})
        finally:
            db.query(ChatSession).filter(ChatSession.id == session_id_str).update(
                {ChatSession.is_processing: False}
            )
            db.commit()

    return StreamingResponse(event_stream(), media_type="text/event-stream")
