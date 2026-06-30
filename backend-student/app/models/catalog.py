from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from app.models.base import Base


class Board(Base):
    __tablename__ = "boards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    name = Column(String(100), unique=True, nullable=False)
    status = Column(String(20), nullable=False, default="inactive")

    classes = relationship("ClassLevel", back_populates="board", cascade="all, delete")


class ClassLevel(Base):
    __tablename__ = "class_levels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    name = Column(String(100), nullable=False)
    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.id"), nullable=False)
    status = Column(String(20), nullable=False, default="inactive")

    board = relationship("Board", back_populates="classes")
    subjects = relationship("Subject", back_populates="class_level", cascade="all, delete")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    name = Column(String(120), nullable=False)
    status = Column(String(20), nullable=False, default="Draft")
    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.id"), nullable=False)
    class_level_id = Column(UUID(as_uuid=True), ForeignKey("class_levels.id"), nullable=False)

    class_level = relationship("ClassLevel", back_populates="subjects")
    board = relationship("Board")
    files = relationship("SubjectFile", back_populates="subject", cascade="all, delete")


class SubjectFile(Base):
    __tablename__ = "subject_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    original_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), nullable=False)
    content_type = Column(String(120), nullable=True)
    size_bytes = Column(Integer, nullable=False, default=0)
    storage_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    subject = relationship("Subject", back_populates="files")


class SubjectChunk(Base):
    __tablename__ = "subject_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    file_id = Column(UUID(as_uuid=True), ForeignKey("subject_files.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page = Column(Integer, nullable=True)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subject = relationship("Subject")
    file = relationship("SubjectFile")
