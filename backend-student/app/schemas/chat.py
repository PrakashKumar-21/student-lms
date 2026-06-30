from uuid import UUID

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str
    board: str | None = None
    class_level: str | None = Field(default=None, alias="class")
    subject: str | None = None
    subject_id: UUID | None = None
    session_id: UUID | None = None

    model_config = {"populate_by_name": True}


class ChatResponse(BaseModel):
    session_id: UUID
    reply: str
    citations: list[str] = []
