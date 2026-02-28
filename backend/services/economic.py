"""
FRED API integration — Federal Reserve Economic Data.

Provides real GDP, unemployment, inflation (CPI), and Fed funds rate.
API docs: https://fred.stlouisfed.org/docs/api/fred/
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# FRED series IDs
SERIES = {
    "gdp": "GDP",                    # Gross Domestic Product (quarterly)
    "unemployment": "UNRATE",         # Unemployment Rate (monthly)
    "cpi": "CPIAUCSL",               # Consumer Price Index (monthly)
    "fed_funds": "FEDFUNDS",          # Federal Funds Rate (monthly)
    "pce": "PCEPI",                   # PCE Price Index (monthly)
    "initial_claims": "ICSA",         # Initial Jobless Claims (weekly)
    "consumer_sentiment": "UMCSENT",  # Univ of Michigan Consumer Sentiment
    "housing_starts": "HOUST",        # Housing Starts (monthly)
}

_cache: dict[str, tuple[datetime, Any]] = {}
CACHE_TTL = timedelta(hours=1)


class FredService:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key
        self.base_url = "https://api.stlouisfed.org/fred/series/observations"

    async def get_indicator(self, series_id: str, limit: int = 12) -> list[dict]:
        """Fetch latest observations for a FRED series."""
        cache_key = f"fred:{series_id}:{limit}"
        if cache_key in _cache:
            cached_at, data = _cache[cache_key]
            if datetime.now(timezone.utc) - cached_at < CACHE_TTL:
                return data

        if not self.api_key:
            logger.warning("FRED API key not configured — returning empty data")
            return []

        params = {
            "series_id": series_id,
            "api_key": self.api_key,
            "file_type": "json",
            "sort_order": "desc",
            "limit": limit,
        }

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(self.base_url, params=params)
                resp.raise_for_status()
                data = resp.json()

            observations = [
                {
                    "date": obs["date"],
                    "value": float(obs["value"]) if obs["value"] != "." else None,
                }
                for obs in data.get("observations", [])
                if obs.get("value") is not None
            ]

            _cache[cache_key] = (datetime.now(timezone.utc), observations)
            return observations

        except Exception as e:
            logger.error(f"FRED API error for {series_id}: {e}")
            return []

    async def get_all_indicators(self) -> dict[str, list[dict]]:
        """Fetch all configured economic indicators."""
        results = {}
        for name, series_id in SERIES.items():
            results[name] = await self.get_indicator(series_id)
        return results

    async def get_summary(self) -> dict:
        """Return a concise summary of current economic conditions."""
        indicators = await self.get_all_indicators()

        def latest_value(key: str) -> float | None:
            obs = indicators.get(key, [])
            return obs[0]["value"] if obs and obs[0]["value"] is not None else None

        return {
            "gdp_latest": latest_value("gdp"),
            "unemployment_rate": latest_value("unemployment"),
            "cpi": latest_value("cpi"),
            "fed_funds_rate": latest_value("fed_funds"),
            "consumer_sentiment": latest_value("consumer_sentiment"),
            "initial_claims": latest_value("initial_claims"),
            "housing_starts": latest_value("housing_starts"),
            "indicators": {k: v[:3] for k, v in indicators.items()},
        }
