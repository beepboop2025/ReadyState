"""
ReadyState — Database layer
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
SQLAlchemy async engine + session factory.
Uses SQLite for development, PostgreSQL for production.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.models import Base

_engine = None
_session_factory = None


def get_engine(database_url: str):
    global _engine
    if _engine is None:
        # SQLite needs special handling for async
        if database_url.startswith("sqlite"):
            connect_args = {"check_same_thread": False}
            _engine = create_async_engine(
                database_url,
                connect_args=connect_args,
                echo=False,
            )
        else:
            _engine = create_async_engine(
                database_url,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
                echo=False,
            )
    return _engine


def get_session_factory(database_url: str):
    global _session_factory
    if _session_factory is None:
        engine = get_engine(database_url)
        _session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return _session_factory


async def init_db(database_url: str):
    """Create all tables if they don't exist."""
    engine = get_engine(database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


