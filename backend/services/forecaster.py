"""
Resilience forecasting — projects readiness score trends.

Uses simple exponential smoothing and linear regression for
short-term forecasts (7–30 days). Falls back gracefully when
insufficient history is available.
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from typing import Sequence

import numpy as np


class ResilienceForecaster:
    def forecast(
        self,
        history: Sequence[dict],
        horizon_days: int = 14,
        alpha: float = 0.3,
    ) -> dict:
        """
        Forecast future readiness scores based on historical data.

        Parameters:
            history: List of {"date": str, "score": float} sorted ascending.
            horizon_days: How many days to forecast.
            alpha: Exponential smoothing factor (0–1). Higher = more weight on recent data.
        """
        if len(history) < 3:
            return {
                "forecast": [],
                "trend": "insufficient_data",
                "confidence": 0.0,
                "method": "none",
            }

        scores = np.array([h["score"] for h in history], dtype=float)
        dates = [h["date"] for h in history]

        # ---- Method 1: Exponential smoothing ----
        smoothed = [scores[0]]
        for i in range(1, len(scores)):
            s = alpha * scores[i] + (1 - alpha) * smoothed[-1]
            smoothed.append(s)

        # ---- Method 2: Linear regression for trend ----
        x = np.arange(len(scores), dtype=float)
        slope, intercept = np.polyfit(x, scores, 1)

        # ---- Combine: use smoothed level with linear trend ----
        last_smoothed = smoothed[-1]
        daily_trend = slope

        forecast_points = []
        last_date = datetime.strptime(dates[-1], "%Y-%m-%d")
        for i in range(1, horizon_days + 1):
            future_date = last_date + timedelta(days=i)
            predicted = last_smoothed + daily_trend * i
            # Clamp to [0, 100]
            predicted = max(0.0, min(100.0, predicted))
            forecast_points.append({
                "date": future_date.strftime("%Y-%m-%d"),
                "predicted_score": round(predicted, 2),
                "lower_bound": round(max(0, predicted - self._confidence_band(i, scores)), 2),
                "upper_bound": round(min(100, predicted + self._confidence_band(i, scores)), 2),
            })

        # Determine trend direction
        if slope > 0.1:
            trend = "improving"
        elif slope < -0.1:
            trend = "declining"
        else:
            trend = "stable"

        # Confidence based on data consistency
        residuals = scores - (slope * x + intercept)
        rmse = float(np.sqrt(np.mean(residuals ** 2)))
        confidence = max(0.0, min(1.0, 1 - rmse / 50))

        return {
            "forecast": forecast_points,
            "trend": trend,
            "daily_trend": round(float(slope), 4),
            "confidence": round(confidence, 3),
            "method": "exponential_smoothing_with_linear_trend",
            "last_actual": {
                "date": dates[-1],
                "score": round(float(scores[-1]), 2),
            },
        }

    def _confidence_band(self, days_ahead: int, historical: np.ndarray) -> float:
        """Compute confidence band width that grows with forecast horizon."""
        std = float(np.std(historical)) if len(historical) > 1 else 5.0
        return std * math.sqrt(days_ahead) * 0.5
