// ─── Environment Configuration ────────────────────────────────────
// All configurable values in one place. Override via .env file:
//   VITE_DRAGONSCOPE_URL=http://myhost:3456

export const DRAGONSCOPE_URL =
  import.meta.env.VITE_DRAGONSCOPE_URL || 'http://localhost:3456';

export const FETCH_TIMEOUT = 5000;
export const CACHE_TTL = 60_000; // 1 minute
export const POLL_INTERVAL = 120_000; // 2 minutes

export const STORAGE_KEY = 'readystate-data';

// ─── Score Thresholds ─────────────────────────────────────────────
// Used consistently across all components for color coding

export const SCORE_THRESHOLDS = {
  STRONG: 80,
  MODERATE: 60,
  DEVELOPING: 40,
  VULNERABLE: 20,
} as const;

export const THREAT_THRESHOLDS = {
  CRITICAL: 75,
  ELEVATED: 55,
  MODERATE: 35,
  LOW: 15,
} as const;

export const HOUSEHOLD_SIZE_LIMITS = {
  MIN: 1,
  MAX: 20,
} as const;

export const USERNAME_MAX_LENGTH = 50;
export const HISTORY_MAX_DAYS = 90;

// ─── Vite Env Type Augmentation ───────────────────────────────────

/// <reference types="vite/client" />
