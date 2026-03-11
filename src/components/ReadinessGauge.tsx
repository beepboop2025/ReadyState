import { useEffect, useId, useRef, useState } from 'react';
import { SCORE_THRESHOLDS } from '../config';
import type { ScoreConfig } from '../types';

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreConfig(score: number): ScoreConfig {
  if (score >= SCORE_THRESHOLDS.STRONG) return { color: '#10b981', glow: 'rgba(16,185,129,0.35)', label: 'Strong', gradient: ['#10b981', '#34d399'] };
  if (score >= SCORE_THRESHOLDS.MODERATE) return { color: '#eab308', glow: 'rgba(234,179,8,0.35)', label: 'Moderate', gradient: ['#eab308', '#facc15'] };
  if (score >= SCORE_THRESHOLDS.DEVELOPING) return { color: '#f59e0b', glow: 'rgba(245,158,11,0.35)', label: 'Developing', gradient: ['#f59e0b', '#fbbf24'] };
  if (score >= SCORE_THRESHOLDS.VULNERABLE) return { color: '#f43f5e', glow: 'rgba(244,63,94,0.35)', label: 'Vulnerable', gradient: ['#f43f5e', '#fb7185'] };
  return { color: '#ef4444', glow: 'rgba(239,68,68,0.35)', label: 'Critical', gradient: ['#ef4444', '#f87171'] };
}

/** Animated counter that smoothly transitions between values */
function useAnimatedValue(target: number, duration = 800): number {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const fromRef = useRef<number>(target);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      // On first mount, animate from 0
      fromRef.current = 0;
    } else {
      fromRef.current = display;
    }

    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;

    startRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + delta * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

interface ReadinessGaugeProps {
  score: number;
  size?: number;
}

export default function ReadinessGauge({ score, size = 200 }: ReadinessGaugeProps) {
  const config = getScoreConfig(score);
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  const circleRef = useRef<SVGCircleElement>(null);
  const glowCircleRef = useRef<SVGCircleElement>(null);
  const prevOffsetRef = useRef<number | null>(null);
  const gradientId = useId();
  const glowGradientId = useId();
  const arcGradientId = useId();
  const displayScore = useAnimatedValue(score, 1200);

  useEffect(() => {
    const el = circleRef.current;
    const glowEl = glowCircleRef.current;
    if (!el) return;
    if (prevOffsetRef.current === null) {
      // First render: animate from full circumference (empty) to target
      el.style.strokeDashoffset = String(CIRCUMFERENCE);
      if (glowEl) glowEl.style.strokeDashoffset = String(CIRCUMFERENCE);
      requestAnimationFrame(() => {
        el.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.strokeDashoffset = String(offset);
        if (glowEl) {
          glowEl.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1)';
          glowEl.style.strokeDashoffset = String(offset);
        }
      });
    } else {
      // Subsequent changes: smooth transition
      el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
      el.style.strokeDashoffset = String(offset);
      if (glowEl) {
        glowEl.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
        glowEl.style.strokeDashoffset = String(offset);
      }
    }
    prevOffsetRef.current = offset;
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
      {/* Outer ambient glow */}
      <div
        className="absolute inset-2 rounded-full blur-3xl transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`,
          opacity: 0.35 + (score / 100) * 0.35,
        }}
      />

      {/* Inner subtle glow ring */}
      <div
        className="absolute inset-6 rounded-full blur-xl transition-all duration-1000"
        style={{
          background: config.glow,
          opacity: 0.15,
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="transform -rotate-90"
        aria-hidden="true"
        style={{
          '--gauge-color': config.color,
          filter: `drop-shadow(0 0 10px ${config.glow})`,
          transition: 'filter 1s ease-out',
        } as React.CSSProperties}
      >
        <defs>
          {/* Red-to-green arc gradient that reflects the full readiness spectrum */}
          <linearGradient id={arcGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          {/* Score-specific gradient for the filled portion */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={config.gradient[0]} />
            <stop offset="100%" stopColor={config.gradient[1]} />
          </linearGradient>
          {/* Glow filter for the arc */}
          <filter id={glowGradientId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track — subtle dashed rings for depth */}
        <circle
          cx="100" cy="100" r={RADIUS}
          stroke="rgb(var(--c-border) / 0.15)"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="100" cy="100" r={RADIUS}
          stroke="rgb(var(--c-border) / 0.08)"
          strokeWidth="10"
          fill="none"
          strokeDasharray="2 8"
        />

        {/* Glow layer behind the arc */}
        <circle
          ref={glowCircleRef}
          cx="100" cy="100" r={RADIUS}
          stroke={config.color}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
          opacity="0.2"
          style={{ filter: 'blur(6px)' }}
        />

        {/* Score arc — with gradient and glow filter */}
        <circle
          ref={circleRef}
          cx="100" cy="100" r={RADIUS}
          stroke={score >= SCORE_THRESHOLDS.MODERATE ? `url(#${arcGradientId})` : `url(#${gradientId})`}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
          filter={`url(#${glowGradientId})`}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-black text-th-heading score-label transition-all duration-300"
          style={{ fontSize: 48 * scale, lineHeight: 1.1 }}
        >
          {displayScore}
        </span>
        <span
          className="font-bold uppercase tracking-[0.15em] mt-1 transition-colors duration-500"
          style={{
            color: config.color,
            fontSize: Math.max(10, 12 * scale),
            textShadow: `0 0 20px ${config.glow}`,
          }}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}
