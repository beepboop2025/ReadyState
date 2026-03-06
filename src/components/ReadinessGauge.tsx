import { useEffect, useRef } from 'react';
import { SCORE_THRESHOLDS } from '../config';
import type { ScoreConfig } from '../types';

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreConfig(score: number): ScoreConfig {
  if (score >= SCORE_THRESHOLDS.STRONG) return { color: '#10b981', glow: 'rgba(16,185,129,0.3)', label: 'Strong', gradient: ['#10b981', '#34d399'] };
  if (score >= SCORE_THRESHOLDS.MODERATE) return { color: '#eab308', glow: 'rgba(234,179,8,0.3)', label: 'Moderate', gradient: ['#eab308', '#facc15'] };
  if (score >= SCORE_THRESHOLDS.DEVELOPING) return { color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', label: 'Developing', gradient: ['#f59e0b', '#fbbf24'] };
  if (score >= SCORE_THRESHOLDS.VULNERABLE) return { color: '#f43f5e', glow: 'rgba(244,63,94,0.3)', label: 'Vulnerable', gradient: ['#f43f5e', '#fb7185'] };
  return { color: '#ef4444', glow: 'rgba(239,68,68,0.3)', label: 'Critical', gradient: ['#ef4444', '#f87171'] };
}

interface ReadinessGaugeProps {
  score: number;
  size?: number;
}

export default function ReadinessGauge({ score, size = 200 }: ReadinessGaugeProps) {
  const config = getScoreConfig(score);
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  const circleRef = useRef<SVGCircleElement>(null);
  const gradientId = `gauge-grad-${score}`;

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    el.style.strokeDashoffset = String(CIRCUMFERENCE);
    requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 1.5s ease-out';
      el.style.strokeDashoffset = String(offset);
    });
  }, [offset]);

  const scale = size / 200;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Readiness score: ${score}% — ${config.label}`}
    >
      {/* Glow */}
      <div
        className="absolute inset-4 rounded-full blur-2xl opacity-40"
        style={{ background: config.glow }}
      />

      <svg width={size} height={size} viewBox="0 0 200 200" className="transform -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={config.gradient[0]} />
            <stop offset="100%" stopColor={config.gradient[1]} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx="100" cy="100" r={RADIUS}
          stroke="rgb(var(--c-border) / 0.4)"
          strokeWidth="10"
          fill="none"
        />

        {/* Score arc */}
        <circle
          ref={circleRef}
          cx="100" cy="100" r={RADIUS}
          stroke={`url(#${gradientId})`}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-th-heading score-label" style={{ fontSize: 48 * scale }}>
          {score}
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: config.color }}>
          {config.label}
        </span>
      </div>
    </div>
  );
}
