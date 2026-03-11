"""
NOAA Weather & Climate service.

Fetches active weather alerts and severe weather data from the
National Weather Service API (no API key needed).
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_cache: dict[str, tuple[datetime, Any]] = {}
CACHE_TTL = timedelta(minutes=10)

NWS_BASE = "https://api.weather.gov"
USER_AGENT = "ReadyState/1.0 (resilience-dashboard)"


class WeatherService:
    _shared_client: httpx.AsyncClient | None = None

    @classmethod
    def _get_client(cls) -> httpx.AsyncClient:
        if cls._shared_client is None or cls._shared_client.is_closed:
            cls._shared_client = httpx.AsyncClient(timeout=10)
        return cls._shared_client

    @classmethod
    async def close_client(cls) -> None:
        if cls._shared_client is not None and not cls._shared_client.is_closed:
            await cls._shared_client.aclose()
            cls._shared_client = None

    async def get_active_alerts(self, area: str = "US") -> list[dict]:
        """Fetch active weather alerts for a region."""
        cache_key = f"weather:alerts:{area}"
        if cache_key in _cache:
            cached_at, data = _cache[cache_key]
            if datetime.now(timezone.utc) - cached_at < CACHE_TTL:
                return data

        try:
            client = self._get_client()
            resp = await client.get(
                f"{NWS_BASE}/alerts/active",
                params={"area": area, "limit": 50},
                headers={"User-Agent": USER_AGENT, "Accept": "application/geo+json"},
            )
            resp.raise_for_status()
            data = resp.json()

            alerts = []
            for feature in data.get("features", []):
                props = feature.get("properties", {})
                alerts.append({
                    "id": props.get("id", ""),
                    "event": props.get("event", ""),
                    "severity": props.get("severity", ""),
                    "certainty": props.get("certainty", ""),
                    "urgency": props.get("urgency", ""),
                    "headline": props.get("headline", ""),
                    "description": (props.get("description", "") or "")[:500],
                    "area_desc": props.get("areaDesc", ""),
                    "effective": props.get("effective", ""),
                    "expires": props.get("expires", ""),
                })

            _cache[cache_key] = (datetime.now(timezone.utc), alerts)
            return alerts

        except Exception as e:
            logger.error(f"NWS API error: {e}")
            return []

    async def get_alert_summary(self) -> dict:
        """Return a summary of active weather threats."""
        alerts = await self.get_active_alerts()

        severity_counts = {}
        event_counts = {}
        for alert in alerts:
            sev = alert["severity"]
            severity_counts[sev] = severity_counts.get(sev, 0) + 1
            evt = alert["event"]
            event_counts[evt] = event_counts.get(evt, 0) + 1

        # Sort by count descending
        top_events = sorted(event_counts.items(), key=lambda x: -x[1])[:10]

        return {
            "total_active_alerts": len(alerts),
            "severity_breakdown": severity_counts,
            "top_events": [{"event": e, "count": c} for e, c in top_events],
            "alerts": alerts[:20],
        }
