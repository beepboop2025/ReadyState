"""
Supply chain disruption tracking.

Combines multiple signals to estimate supply chain stress:
1. FRED data (ISM Manufacturing, freight indices)
2. News keyword monitoring (shortage, supply chain, logistics)
3. Commodity price movements (oil, shipping costs)
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_cache: dict[str, tuple[datetime, Any]] = {}
CACHE_TTL = timedelta(hours=1)

# FRED series for supply chain health
SUPPLY_CHAIN_SERIES = {
    "ism_manufacturing": "MANEMP",     # ISM Manufacturing Employment
    "ppi_commodities": "PPIACO",       # Producer Price Index: All Commodities
    "imports": "IMPGS",                 # Real imports of goods and services
    "exports": "EXPGS",                 # Real exports
    "inventory_sales": "ISRATIO",       # Inventory to Sales Ratio
}


class SupplyChainService:
    def __init__(self, fred_api_key: str | None = None):
        self.fred_api_key = fred_api_key
        self.fred_base = "https://api.stlouisfed.org/fred/series/observations"

    async def _get_fred_series(self, series_id: str, limit: int = 6) -> list[dict]:
        """Fetch a FRED time series."""
        if not self.fred_api_key:
            return []

        cache_key = f"sc-fred:{series_id}"
        if cache_key in _cache:
            cached_at, data = _cache[cache_key]
            if datetime.now(timezone.utc) - cached_at < CACHE_TTL:
                return data

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    self.fred_base,
                    params={
                        "series_id": series_id,
                        "api_key": self.fred_api_key,
                        "file_type": "json",
                        "sort_order": "desc",
                        "limit": limit,
                    },
                )
                resp.raise_for_status()
                data = resp.json()

            obs = [
                {"date": o["date"], "value": float(o["value"])}
                for o in data.get("observations", [])
                if o.get("value") and o["value"] != "."
            ]
            _cache[cache_key] = (datetime.now(timezone.utc), obs)
            return obs
        except Exception as e:
            logger.error(f"FRED error for {series_id}: {e}")
            return []

    async def get_indicators(self) -> dict[str, list[dict]]:
        """Fetch all supply chain indicators."""
        results = {}
        for name, series_id in SUPPLY_CHAIN_SERIES.items():
            results[name] = await self._get_fred_series(series_id)
        return results

    async def compute_stress_index(self) -> dict:
        """Compute a composite supply chain stress index (0–100)."""
        indicators = await self.get_indicators()

        def trend_signal(obs: list[dict]) -> float:
            """Return a stress signal based on recent trend. 0 = improving, 1 = worsening."""
            if len(obs) < 2:
                return 0.5
            latest = obs[0]["value"]
            prev = obs[1]["value"]
            if prev == 0:
                return 0.5
            pct_change = (latest - prev) / abs(prev) * 100
            # PPI increasing = stress, inventory/sales ratio increasing = stress
            return min(1.0, max(0.0, 0.5 + pct_change / 20))

        signals = {}
        for name, obs in indicators.items():
            signals[name] = trend_signal(obs)

        if not signals:
            return {
                "stress_index": 50.0,
                "signals": {},
                "status": "no_data",
                "computed_at": datetime.now(timezone.utc).isoformat(),
            }

        avg_stress = sum(signals.values()) / len(signals) * 100

        if avg_stress < 30:
            status = "low"
        elif avg_stress < 60:
            status = "moderate"
        else:
            status = "elevated"

        return {
            "stress_index": round(avg_stress, 1),
            "signals": {k: round(v, 3) for k, v in signals.items()},
            "status": status,
            "indicators": {k: v[:3] for k, v in indicators.items()},
            "computed_at": datetime.now(timezone.utc).isoformat(),
        }
