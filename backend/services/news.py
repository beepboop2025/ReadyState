"""
News service — aggregates crisis/resilience news from NewsAPI.

Tracks keyword frequencies for threat-level estimation:
recession, layoffs, hack, breach, pandemic, outbreak, disaster, evacuation, etc.
"""

from __future__ import annotations

import logging
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)

CRISIS_KEYWORDS = [
    "recession", "layoffs", "unemployment", "bankruptcy",
    "hack", "breach", "cyberattack", "ransomware",
    "pandemic", "outbreak", "epidemic", "quarantine",
    "disaster", "earthquake", "hurricane", "wildfire", "flood",
    "evacuation", "blackout", "power outage", "grid failure",
    "inflation", "supply chain", "shortage",
]

_cache: dict[str, tuple[datetime, Any]] = {}
CACHE_TTL = timedelta(minutes=15)


class NewsService:
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

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key
        self.base_url = "https://newsapi.org/v2"

    async def get_headlines(self, query: str = "crisis OR disaster OR economy", page_size: int = 50) -> list[dict]:
        """Fetch top headlines matching a query."""
        cache_key = f"news:{query}:{page_size}"
        if cache_key in _cache:
            cached_at, data = _cache[cache_key]
            if datetime.now(timezone.utc) - cached_at < CACHE_TTL:
                return data

        if not self.api_key:
            logger.warning("NewsAPI key not configured — returning empty data")
            return []

        params = {
            "q": query,
            "apiKey": self.api_key,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": page_size,
        }

        try:
            client = self._get_client()
            resp = await client.get(f"{self.base_url}/everything", params=params)
            resp.raise_for_status()
            data = resp.json()

            articles = [
                {
                    "title": a.get("title", ""),
                    "description": a.get("description", ""),
                    "source": a.get("source", {}).get("name", ""),
                    "url": a.get("url", ""),
                    "published_at": a.get("publishedAt", ""),
                }
                for a in data.get("articles", [])
            ]

            _cache[cache_key] = (datetime.now(timezone.utc), articles)
            return articles

        except Exception as e:
            logger.error(f"NewsAPI error: {e}")
            return []

    async def get_crisis_keyword_counts(self) -> dict[str, int]:
        """Count occurrences of crisis keywords in recent headlines."""
        articles = await self.get_headlines(
            query=" OR ".join(CRISIS_KEYWORDS[:10]),  # API limits query length
            page_size=100,
        )

        counts: Counter = Counter()
        for article in articles:
            text = f"{article['title']} {article['description']}".lower()
            for keyword in CRISIS_KEYWORDS:
                if keyword in text:
                    counts[keyword] += 1

        return dict(counts)

    async def get_threat_summary(self) -> dict:
        """Return a threat-oriented news summary."""
        counts = await self.get_crisis_keyword_counts()
        articles = await self.get_headlines()

        # Group by category
        categories = {
            "economic": ["recession", "layoffs", "unemployment", "bankruptcy", "inflation"],
            "cyber": ["hack", "breach", "cyberattack", "ransomware"],
            "health": ["pandemic", "outbreak", "epidemic", "quarantine"],
            "natural_disaster": ["disaster", "earthquake", "hurricane", "wildfire", "flood"],
            "infrastructure": ["evacuation", "blackout", "power outage", "grid failure"],
            "supply_chain": ["supply chain", "shortage"],
        }

        category_scores = {}
        for cat, keywords in categories.items():
            category_scores[cat] = sum(counts.get(k, 0) for k in keywords)

        return {
            "keyword_counts": counts,
            "category_scores": category_scores,
            "total_articles": len(articles),
            "top_headlines": articles[:10],
        }
