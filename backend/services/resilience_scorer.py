"""
Composite resilience scoring algorithm.

Combines readiness scores (from checklist completion) with external
threat signals to produce a real-time resilience assessment.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone

# Domain weights for composite scoring
DOMAIN_WEIGHTS = {
    "financial": 0.20,
    "supplies": 0.18,
    "digital": 0.15,
    "health": 0.17,
    "skills": 0.15,
    "network": 0.15,
}

# How each scenario maps to domain impacts
SCENARIO_IMPACTS = {
    "job_loss": {"financial": 0.40, "skills": 0.25, "network": 0.15, "health": 0.10, "supplies": 0.05, "digital": 0.05},
    "natural_disaster": {"supplies": 0.30, "network": 0.20, "health": 0.20, "financial": 0.15, "skills": 0.10, "digital": 0.05},
    "cyberattack": {"digital": 0.40, "financial": 0.30, "skills": 0.10, "network": 0.10, "health": 0.05, "supplies": 0.05},
    "pandemic": {"health": 0.35, "supplies": 0.25, "financial": 0.20, "network": 0.10, "digital": 0.05, "skills": 0.05},
    "power_outage": {"supplies": 0.30, "digital": 0.25, "skills": 0.20, "health": 0.10, "network": 0.10, "financial": 0.05},
    "medical_emergency": {"health": 0.35, "network": 0.25, "financial": 0.20, "supplies": 0.10, "skills": 0.05, "digital": 0.05},
    "recession": {"financial": 0.35, "skills": 0.25, "network": 0.15, "supplies": 0.10, "health": 0.10, "digital": 0.05},
    "forced_relocation": {"supplies": 0.25, "network": 0.25, "financial": 0.20, "health": 0.15, "skills": 0.10, "digital": 0.05},
}


class ResilienceScorer:
    def compute_overall_score(self, domain_scores: dict[str, float]) -> float:
        """Compute weighted overall readiness score."""
        total_weight = sum(DOMAIN_WEIGHTS.get(d, 0) for d in domain_scores)
        if total_weight == 0:
            return 0.0
        score = sum(
            domain_scores.get(d, 0) * DOMAIN_WEIGHTS.get(d, 0)
            for d in DOMAIN_WEIGHTS
        ) / total_weight
        return round(min(100, max(0, score)), 2)

    def compute_scenario_scores(self, domain_scores: dict[str, float]) -> dict[str, float]:
        """Compute readiness score for each crisis scenario."""
        results = {}
        for scenario, impacts in SCENARIO_IMPACTS.items():
            score = sum(
                domain_scores.get(domain, 0) * weight
                for domain, weight in impacts.items()
            )
            results[scenario] = round(min(100, max(0, score)), 2)
        return results

    def compute_effective_risk(
        self,
        domain_scores: dict[str, float],
        threat_levels: dict[str, float],
    ) -> dict:
        """
        Combine readiness with threat levels for effective risk assessment.

        effective_risk = threat_level * (1 - readiness / 100)
        Lower readiness + higher threat = higher effective risk.
        """
        overall = self.compute_overall_score(domain_scores)
        scenario_scores = self.compute_scenario_scores(domain_scores)

        effective_risks = {}
        for scenario, readiness in scenario_scores.items():
            threat = threat_levels.get(scenario, 0)
            risk = threat * (1 - readiness / 100)
            effective_risks[scenario] = round(min(100, max(0, risk)), 2)

        # Overall effective risk
        avg_threat = sum(threat_levels.values()) / max(len(threat_levels), 1)
        overall_risk = avg_threat * (1 - overall / 100)

        return {
            "overall_readiness": overall,
            "overall_effective_risk": round(overall_risk, 2),
            "scenario_readiness": scenario_scores,
            "scenario_risks": effective_risks,
            "threat_levels": threat_levels,
            "weakest_domains": self._find_weakest(domain_scores, 3),
            "computed_at": datetime.now(timezone.utc).isoformat(),
        }

    def generate_recommendations(self, domain_scores: dict[str, float]) -> list[dict]:
        """Generate prioritized improvement recommendations."""
        recs = []
        for domain, score in sorted(domain_scores.items(), key=lambda x: x[0]):
            weight = DOMAIN_WEIGHTS.get(domain, 0.15)
            # Impact-weighted gap: how much overall score would improve
            gap = (100 - score) * weight
            if gap > 0:
                priority = "high" if score < 40 else ("medium" if score < 70 else "low")
                recs.append({
                    "domain": domain,
                    "current_score": score,
                    "potential_impact": round(gap, 2),
                    "priority": priority,
                })

        recs.sort(key=lambda r: -r["potential_impact"])
        return recs

    def _find_weakest(self, domain_scores: dict[str, float], n: int) -> list[str]:
        """Return the n weakest domains."""
        sorted_domains = sorted(domain_scores.items(), key=lambda x: x[1])
        return [d for d, _ in sorted_domains[:n]]
