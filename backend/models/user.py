"""User-related database models."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.models import Base


def _utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), default="")
    household_size: Mapped[int] = mapped_column(Integer, default=1)
    # Checked item IDs stored as JSON array
    checked_ids: Mapped[dict] = mapped_column(JSON, default=list)
    theme: Mapped[str] = mapped_column(String(10), default="dark")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    scores: Mapped[list["UserScore"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    history: Mapped[list["ScoreHistory"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    alerts: Mapped[list["AlertPreference"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserScore(Base):
    """Cached per-domain readiness scores for a user."""
    __tablename__ = "user_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    domain: Mapped[str] = mapped_column(String(50))  # financial, supplies, digital, health, skills, network
    score: Mapped[float] = mapped_column(Float, default=0.0)
    total_items: Mapped[int] = mapped_column(Integer, default=0)
    checked_items: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    user: Mapped["User"] = relationship(back_populates="scores")


class ScoreHistory(Base):
    """Daily snapshot of a user's overall readiness score."""
    __tablename__ = "score_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    date: Mapped[str] = mapped_column(String(10))  # YYYY-MM-DD
    overall_score: Mapped[float] = mapped_column(Float)
    domain_scores: Mapped[dict] = mapped_column(JSON)  # {financial: 80, supplies: 60, ...}
    threat_level: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    user: Mapped["User"] = relationship(back_populates="history")


class AlertPreference(Base):
    """User alert/notification preferences."""
    __tablename__ = "alert_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    alert_type: Mapped[str] = mapped_column(String(50))  # threat_spike, score_drop, weekly_report
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    channel: Mapped[str] = mapped_column(String(20), default="email")  # email, webhook
    webhook_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    threshold: Mapped[float | None] = mapped_column(Float, nullable=True)

    user: Mapped["User"] = relationship(back_populates="alerts")
