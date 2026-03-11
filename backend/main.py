"""
ReadyState — FastAPI Backend
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Provides real data sources, persistence, resilience analysis, and
alerting for the ReadyState resilience dashboard.

Endpoints:
    GET  /health               — Liveness probe
    GET  /api/economic          — FRED economic indicators
    GET  /api/news              — Crisis news + keyword counts
    GET  /api/weather           — Active weather alerts (NOAA)
    GET  /api/supply-chain      — Supply chain stress index
    GET  /api/threats           — Combined threat assessment
    POST /api/score             — Compute resilience score from domain data
    POST /api/forecast          — Forecast readiness trend
    POST /api/alerts/evaluate   — Evaluate alert rules
    GET  /api/user/{user_id}    — Get user profile + scores
    PUT  /api/user/{user_id}    — Update user checklist / profile
    GET  /api/user/{user_id}/history — Score history
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from functools import lru_cache
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_session_factory, init_db
from backend.models.user import AlertPreference, ScoreHistory, User, UserScore
from backend.services.alert_engine import AlertEngine
from backend.services.economic import FredService
from backend.services.forecaster import ResilienceForecaster
from backend.services.news import NewsService
from backend.services.resilience_scorer import ResilienceScorer
from backend.services.supply_chain import SupplyChainService
from backend.services.weather import WeatherService


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./readystate.db"
    fred_api_key: str = ""
    news_api_key: str = ""
    cors_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:5173"
    smtp_host: str = ""

    class Config:
        env_prefix = "READYSTATE_"


@lru_cache
def get_settings() -> Settings:
    return Settings()


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    await init_db(settings.database_url)
    yield


app = FastAPI(title="ReadyState API", version="0.1.0", lifespan=lifespan)

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Service singletons
# ---------------------------------------------------------------------------

_fred_instance: FredService | None = None
_news_instance: NewsService | None = None
_weather_instance: WeatherService | None = None
_supply_chain_instance: SupplyChainService | None = None


def _fred() -> FredService:
    global _fred_instance
    if _fred_instance is None:
        _fred_instance = FredService(get_settings().fred_api_key or None)
    return _fred_instance


def _news() -> NewsService:
    global _news_instance
    if _news_instance is None:
        _news_instance = NewsService(get_settings().news_api_key or None)
    return _news_instance


def _weather() -> WeatherService:
    global _weather_instance
    if _weather_instance is None:
        _weather_instance = WeatherService()
    return _weather_instance


def _supply_chain() -> SupplyChainService:
    global _supply_chain_instance
    if _supply_chain_instance is None:
        _supply_chain_instance = SupplyChainService(get_settings().fred_api_key or None)
    return _supply_chain_instance


_scorer = ResilienceScorer()
_forecaster = ResilienceForecaster()
_alert_engine = AlertEngine(smtp_host=get_settings().smtp_host or None)


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class ScoreRequest(BaseModel):
    domain_scores: dict[str, float]
    threat_levels: dict[str, float] | None = None


class ForecastRequest(BaseModel):
    history: list[dict]
    horizon_days: int = 14


class AlertEvalRequest(BaseModel):
    current_threats: dict[str, float]
    previous_threats: dict[str, float]
    current_scores: dict[str, float]
    previous_scores: dict[str, float]
    threshold_threat: float = 20.0
    threshold_score: float = 10.0


class UserUpdate(BaseModel):
    name: str | None = Field(None, max_length=50)
    household_size: int | None = Field(None, ge=1, le=20)
    checked_ids: list[str] | None = None
    theme: Literal["dark", "light"] | None = None
    domain_scores: dict[str, float] | None = None


# ---------------------------------------------------------------------------
# Routes — Health
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "readystate-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Routes — External Data
# ---------------------------------------------------------------------------

@app.get("/api/economic")
async def get_economic():
    """FRED economic indicators."""
    return await _fred().get_summary()


@app.get("/api/news")
async def get_news():
    """Crisis news + keyword counts."""
    return await _news().get_threat_summary()


@app.get("/api/weather")
async def get_weather():
    """Active NOAA weather alerts."""
    return await _weather().get_alert_summary()


@app.get("/api/supply-chain")
async def get_supply_chain():
    """Supply chain stress index."""
    return await _supply_chain().compute_stress_index()


@app.get("/api/threats")
async def get_threats():
    """Combined threat assessment from all sources."""
    economic = await _fred().get_summary()
    news = await _news().get_threat_summary()
    weather = await _weather().get_alert_summary()
    supply = await _supply_chain().compute_stress_index()

    # Build scenario-level threat estimates from external signals
    threat_levels = _estimate_threats(economic, news, weather, supply)

    return {
        "threat_levels": threat_levels,
        "sources": {
            "economic": {
                "unemployment": economic.get("unemployment_rate"),
                "cpi": economic.get("cpi"),
                "fed_funds": economic.get("fed_funds_rate"),
            },
            "news_categories": news.get("category_scores", {}),
            "weather_alerts": weather.get("total_active_alerts", 0),
            "supply_chain_stress": supply.get("stress_index", 50),
        },
    }


def _estimate_threats(economic: dict, news: dict, weather: dict, supply: dict) -> dict[str, float]:
    """Map external signals to per-scenario threat levels (0–100)."""
    threats = {s: 10.0 for s in [
        "job_loss", "natural_disaster", "cyberattack", "pandemic",
        "power_outage", "medical_emergency", "recession", "forced_relocation",
    ]}

    # Economic signals
    unemp = economic.get("unemployment_rate")
    if unemp and unemp > 5:
        threats["job_loss"] += min(40, (unemp - 5) * 10)
        threats["recession"] += min(30, (unemp - 5) * 8)

    cpi = economic.get("cpi")
    if cpi and cpi > 280:  # CPI index level (approximate)
        threats["recession"] += 10

    # News signals
    cat_scores = news.get("category_scores", {})
    threats["recession"] += min(30, cat_scores.get("economic", 0) * 3)
    threats["cyberattack"] += min(40, cat_scores.get("cyber", 0) * 5)
    threats["pandemic"] += min(40, cat_scores.get("health", 0) * 5)
    threats["natural_disaster"] += min(30, cat_scores.get("natural_disaster", 0) * 4)
    threats["power_outage"] += min(25, cat_scores.get("infrastructure", 0) * 5)

    # Weather signals
    active_alerts = weather.get("total_active_alerts", 0)
    severe = weather.get("severity_breakdown", {})
    extreme_count = severe.get("Extreme", 0) + severe.get("Severe", 0)
    threats["natural_disaster"] += min(30, extreme_count * 5)
    threats["forced_relocation"] += min(20, extreme_count * 3)

    # Supply chain
    stress = supply.get("stress_index", 50)
    if stress > 60:
        threats["recession"] += min(15, (stress - 60) * 0.5)

    # Clamp all to [0, 100]
    return {k: round(min(100, max(0, v)), 1) for k, v in threats.items()}


# ---------------------------------------------------------------------------
# Routes — Analysis
# ---------------------------------------------------------------------------

@app.post("/api/score")
async def compute_score(req: ScoreRequest):
    """Compute resilience score from domain data."""
    threats = req.threat_levels or {}
    if threats:
        return _scorer.compute_effective_risk(req.domain_scores, threats)
    else:
        overall = _scorer.compute_overall_score(req.domain_scores)
        scenarios = _scorer.compute_scenario_scores(req.domain_scores)
        recommendations = _scorer.generate_recommendations(req.domain_scores)
        return {
            "overall_readiness": overall,
            "scenario_scores": scenarios,
            "recommendations": recommendations,
        }


@app.post("/api/forecast")
async def forecast(req: ForecastRequest):
    """Forecast readiness trend."""
    return _forecaster.forecast(req.history, req.horizon_days)


@app.post("/api/alerts/evaluate")
async def evaluate_alerts(req: AlertEvalRequest):
    """Evaluate alert rules and return triggered alerts."""
    threat_alerts = _alert_engine.evaluate_threat_spike(
        req.current_threats, req.previous_threats, req.threshold_threat,
    )
    score_alerts = _alert_engine.evaluate_score_drop(
        req.current_scores, req.previous_scores, req.threshold_score,
    )
    all_alerts = [a.to_dict() for a in threat_alerts + score_alerts]
    return {"alerts": all_alerts, "total": len(all_alerts)}


# ---------------------------------------------------------------------------
# Routes — User Persistence
# ---------------------------------------------------------------------------

@app.get("/api/user/{user_id}")
async def get_user(user_id: str):
    """Get user profile and scores."""
    s = get_settings()
    factory = get_session_factory(s.database_url)
    async with factory() as session:
        user = await session.get(User, user_id)
        if not user:
            raise HTTPException(404, "User not found")

        scores_result = await session.execute(
            select(UserScore).where(UserScore.user_id == user_id)
        )
        scores = {s.domain: s.score for s in scores_result.scalars()}

        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "household_size": user.household_size,
            "checked_ids": user.checked_ids,
            "theme": user.theme,
            "domain_scores": scores,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }


@app.put("/api/user/{user_id}")
async def update_user(user_id: str, update: UserUpdate):
    """Update user checklist or profile."""
    s = get_settings()
    factory = get_session_factory(s.database_url)
    async with factory() as session:
        user = await session.get(User, user_id)
        if not user:
            raise HTTPException(404, "User not found")

        if update.name is not None:
            user.name = update.name
        if update.household_size is not None:
            user.household_size = update.household_size
        if update.checked_ids is not None:
            user.checked_ids = update.checked_ids
        if update.theme is not None:
            user.theme = update.theme

        # Update domain scores if provided
        if update.domain_scores:
            for domain, score in update.domain_scores.items():
                existing = await session.execute(
                    select(UserScore).where(
                        UserScore.user_id == user_id,
                        UserScore.domain == domain,
                    )
                )
                user_score = existing.scalar_one_or_none()
                if user_score:
                    user_score.score = score
                else:
                    session.add(UserScore(user_id=user_id, domain=domain, score=score))

        await session.commit()
        return {"status": "updated"}


@app.get("/api/user/{user_id}/history")
async def get_user_history(user_id: str, days: int = 90):
    """Get score history for forecasting."""
    s = get_settings()
    factory = get_session_factory(s.database_url)
    async with factory() as session:
        result = await session.execute(
            select(ScoreHistory)
            .where(ScoreHistory.user_id == user_id)
            .order_by(ScoreHistory.date.desc())
            .limit(days)
        )
        rows = result.scalars().all()
        return [
            {
                "date": r.date,
                "score": r.overall_score,
                "domain_scores": r.domain_scores,
                "threat_level": r.threat_level,
            }
            for r in reversed(rows)
        ]
