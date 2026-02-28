"""SQLAlchemy models for ReadyState."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from backend.models.user import User, UserScore, ScoreHistory, AlertPreference  # noqa: E402, F401
