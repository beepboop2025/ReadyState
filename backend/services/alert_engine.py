"""
Alert engine — threshold-based alerting with email/webhook.

Monitors threat levels and readiness scores, triggering alerts when:
1. A threat level spikes above a threshold
2. Readiness score drops significantly
3. Weekly report is due
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class AlertRule:
    """A single alert rule definition."""

    def __init__(
        self,
        rule_type: str,
        threshold: float,
        channel: str = "webhook",
        webhook_url: str | None = None,
        email: str | None = None,
    ):
        self.rule_type = rule_type
        self.threshold = threshold
        self.channel = channel
        self.webhook_url = webhook_url
        self.email = email


class Alert:
    """A triggered alert."""

    def __init__(self, rule_type: str, severity: str, message: str, data: dict):
        self.rule_type = rule_type
        self.severity = severity
        self.message = message
        self.data = data
        self.triggered_at = datetime.now(timezone.utc)

    def to_dict(self) -> dict:
        return {
            "rule_type": self.rule_type,
            "severity": self.severity,
            "message": self.message,
            "data": self.data,
            "triggered_at": self.triggered_at.isoformat(),
        }


class AlertEngine:
    def __init__(self, smtp_host: str | None = None, smtp_port: int = 587):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port

    def evaluate_threat_spike(
        self,
        current_threats: dict[str, float],
        previous_threats: dict[str, float],
        threshold: float = 20.0,
    ) -> list[Alert]:
        """Detect scenarios where threat level increased by more than threshold."""
        alerts = []
        for scenario, current in current_threats.items():
            previous = previous_threats.get(scenario, 0)
            delta = current - previous
            if delta >= threshold:
                severity = "critical" if delta >= 40 else ("high" if delta >= 30 else "medium")
                alerts.append(Alert(
                    rule_type="threat_spike",
                    severity=severity,
                    message=f"{scenario} threat level increased by {delta:.1f} points (now {current:.1f})",
                    data={
                        "scenario": scenario,
                        "current_level": current,
                        "previous_level": previous,
                        "delta": round(delta, 2),
                    },
                ))
        return alerts

    def evaluate_score_drop(
        self,
        current_scores: dict[str, float],
        previous_scores: dict[str, float],
        threshold: float = 10.0,
    ) -> list[Alert]:
        """Detect domains where readiness score dropped significantly."""
        alerts = []
        for domain, current in current_scores.items():
            previous = previous_scores.get(domain, current)
            delta = previous - current
            if delta >= threshold:
                severity = "high" if delta >= 20 else "medium"
                alerts.append(Alert(
                    rule_type="score_drop",
                    severity=severity,
                    message=f"{domain} readiness dropped by {delta:.1f} points (now {current:.1f}%)",
                    data={
                        "domain": domain,
                        "current_score": current,
                        "previous_score": previous,
                        "delta": round(delta, 2),
                    },
                ))
        return alerts

    def generate_weekly_summary(
        self,
        domain_scores: dict[str, float],
        overall_score: float,
        threat_levels: dict[str, float],
    ) -> Alert:
        """Generate a weekly readiness summary alert."""
        avg_threat = sum(threat_levels.values()) / max(len(threat_levels), 1)
        effective_risk = avg_threat * (1 - overall_score / 100)

        weakest = sorted(domain_scores.items(), key=lambda x: x[1])[:3]

        return Alert(
            rule_type="weekly_report",
            severity="info",
            message=f"Weekly readiness: {overall_score:.1f}% | Effective risk: {effective_risk:.1f}",
            data={
                "overall_score": overall_score,
                "effective_risk": round(effective_risk, 2),
                "domain_scores": domain_scores,
                "weakest_domains": [{"domain": d, "score": s} for d, s in weakest],
                "avg_threat_level": round(avg_threat, 2),
            },
        )

    async def send_webhook(self, url: str, alert: Alert) -> bool:
        """Dispatch alert via webhook POST."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(url, json=alert.to_dict())
                resp.raise_for_status()
                logger.info(f"Webhook alert sent: {alert.rule_type}")
                return True
        except Exception as e:
            logger.error(f"Webhook delivery failed: {e}")
            return False

    async def send_email(self, to: str, alert: Alert) -> bool:
        """Send alert via email (stub — implement with aiosmtplib)."""
        if not self.smtp_host:
            logger.warning("SMTP not configured — skipping email alert")
            return False

        # In production, use aiosmtplib:
        # async with aiosmtplib.SMTP(self.smtp_host, self.smtp_port) as smtp:
        #     ...
        logger.info(f"Email alert to {to}: {alert.message}")
        return True
