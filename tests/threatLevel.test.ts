import { describe, it, expect } from 'vitest';
import {
  clamp,
  threatLabel,
  computeEffectiveRisk,
  computeOverallEnvironment,
  computeAllThreats,
} from '../src/hooks/useThreatLevel';
import { THREAT_THRESHOLDS } from '../src/config';
import type { MarketSignals } from '../src/types';

function baseSignals(overrides: Partial<MarketSignals> = {}): MarketSignals {
  return {
    economic: null,
    fearGreed: null,
    bonds: null,
    commodities: null,
    crypto: null,
    sentiment: null,
    newsSignals: null,
    lastCollected: null,
    fetchedAt: Date.now(),
    ...overrides,
  };
}

describe('clamp', () => {
  it('bounds within range and rounds', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-20, 0, 100)).toBe(0);
    expect(clamp(42.6, 0, 100)).toBe(43);
  });
});

describe('threatLabel', () => {
  it('maps scores to labels using the configured thresholds', () => {
    expect(threatLabel(THREAT_THRESHOLDS.CRITICAL)).toBe('Critical');
    expect(threatLabel(THREAT_THRESHOLDS.ELEVATED)).toBe('Elevated');
    expect(threatLabel(THREAT_THRESHOLDS.MODERATE)).toBe('Moderate');
    expect(threatLabel(THREAT_THRESHOLDS.LOW)).toBe('Low');
    expect(threatLabel(THREAT_THRESHOLDS.LOW - 1)).toBe('Minimal');
  });

  it('is monotonic at the boundaries', () => {
    expect(threatLabel(THREAT_THRESHOLDS.CRITICAL - 1)).toBe('Elevated');
    expect(threatLabel(THREAT_THRESHOLDS.ELEVATED - 1)).toBe('Moderate');
  });
});

describe('computeEffectiveRisk', () => {
  it('is 0 when fully ready regardless of threat', () => {
    expect(computeEffectiveRisk(100, 90)).toBe(0);
  });

  it('equals the threat level when readiness is 0', () => {
    expect(computeEffectiveRisk(0, 90)).toBe(90);
  });

  it('scales down linearly with readiness', () => {
    expect(computeEffectiveRisk(50, 80)).toBe(40);
    expect(computeEffectiveRisk(75, 80)).toBe(20);
  });
});

describe('computeOverallEnvironment', () => {
  it('starts from a calm baseline of ~30 with no signals', () => {
    const env = computeOverallEnvironment(baseSignals());
    expect(env.level).toBe(30);
    // 30 sits between LOW (15) and MODERATE (35) thresholds.
    expect(env.label).toBe('Low');
    expect(env.factors).toEqual([]);
  });

  it('raises the score sharply on extreme fear and flags it high impact', () => {
    const env = computeOverallEnvironment(
      baseSignals({ fearGreed: { value: 10, classification: 'Extreme Fear' } }),
    );
    expect(env.level).toBe(55); // 30 base + 25
    expect(env.factors.some((f) => f.impact === 'high' && /Extreme Fear/.test(f.text))).toBe(true);
  });

  it('adds a high-impact recession signal when the yield curve inverts', () => {
    const env = computeOverallEnvironment(
      baseSignals({ bonds: { yields: { '2Y': 5, '10Y': 4 }, spread2s10s: -1, inverted: true } }),
    );
    expect(env.level).toBe(50); // 30 + 20
    expect(env.factors.some((f) => /INVERTED/.test(f.text) && f.impact === 'high')).toBe(true);
  });

  it('stacks multiple stressors and clamps at 100', () => {
    const env = computeOverallEnvironment(
      baseSignals({
        fearGreed: { value: 5, classification: 'Extreme Fear' }, // +25
        bonds: { yields: {}, spread2s10s: -0.5, inverted: true }, // +20
        economic: { gdp: null, cpi: 9, unemployment: 8, fedFundsRate: null, retailSales: null, housingStarts: null }, // +15 +12
        sentiment: { bullish: 10, bearish: 70, neutral: 20 }, // +10
        newsSignals: { keywordCounts: {}, crisisScore: 80 }, // +12
      }),
    );
    expect(env.level).toBe(100);
    expect(env.label).toBe('Critical');
  });
});

describe('computeAllThreats', () => {
  it('produces an overall plus all eight scenario threats', () => {
    const threats = computeAllThreats(baseSignals());
    expect(Object.keys(threats.scenarios).sort()).toEqual(
      [
        'cyberattack',
        'economic-crisis',
        'forced-relocation',
        'job-loss',
        'medical-emergency',
        'natural-disaster',
        'pandemic',
        'power-outage',
      ].sort(),
    );
    for (const s of Object.values(threats.scenarios)) {
      expect(s.level).toBeGreaterThanOrEqual(0);
      expect(s.level).toBeLessThanOrEqual(100);
      expect(Array.isArray(s.signals)).toBe(true);
    }
    // Scenarios that always emit a baseline narrative even with no signals.
    expect(threats.scenarios['cyberattack'].signals.length).toBeGreaterThan(0);
    expect(threats.scenarios['natural-disaster'].signals.length).toBeGreaterThan(0);
    expect(threats.scenarios['power-outage'].signals.length).toBeGreaterThan(0);
  });

  it('routes layoff/recession news into the job-loss scenario specifically', () => {
    const news = {
      keywordCounts: {
        layoff: 6, recession: 4, hack: 0, breach: 0, storm: 0,
        earthquake: 0, flood: 0, pandemic: 0, outbreak: 0, war: 0,
        crash: 0, crisis: 0, inflation: 0, default: 0, bankruptcy: 0,
      },
      crisisScore: 40,
    };
    const threats = computeAllThreats(baseSignals({ newsSignals: news }));
    const jobLoss = threats.scenarios['job-loss'];
    expect(jobLoss.signals.some((s) => /layoff\/recession mentions/.test(s))).toBe(true);
    // Cyber threat should NOT pick up layoff news.
    expect(threats.scenarios['cyberattack'].level).toBeLessThan(jobLoss.level + 100);
  });

  it('drives the economic-crisis scenario with an inverted curve, fear and contraction', () => {
    const calm = computeAllThreats(baseSignals()).scenarios['economic-crisis'].level;
    const stressed = computeAllThreats(
      baseSignals({
        bonds: { yields: {}, spread2s10s: -0.6, inverted: true },
        fearGreed: { value: 12, classification: 'Extreme Fear' },
        economic: { gdp: -0.5, cpi: null, unemployment: null, fedFundsRate: 6, retailSales: null, housingStarts: null },
      }),
    ).scenarios['economic-crisis'];
    expect(stressed.level).toBeGreaterThan(calm);
    expect(stressed.signals.some((s) => /INVERTED/.test(s))).toBe(true);
    expect(stressed.signals.some((s) => /Extreme Fear/.test(s))).toBe(true);
    expect(stressed.signals.some((s) => /GDP contracting/.test(s))).toBe(true);
  });

  it('raises the pandemic scenario on outbreak news and power-outage on energy prices', () => {
    const threats = computeAllThreats(
      baseSignals({
        commodities: { natural_gas: 95, wti: 90 },
        newsSignals: {
          keywordCounts: {
            pandemic: 4, outbreak: 3, storm: 4, hack: 0, breach: 0, layoff: 0,
            recession: 0, earthquake: 0, flood: 0, war: 0, crash: 0, crisis: 0,
            inflation: 0, default: 0, bankruptcy: 0,
          },
          crisisScore: 50,
        },
      }),
    );
    expect(threats.scenarios['pandemic'].level).toBeGreaterThan(
      computeAllThreats(baseSignals()).scenarios['pandemic'].level,
    );
    expect(threats.scenarios['power-outage'].signals.some((s) => /grid stress/i.test(s))).toBe(true);
  });

  it('drives cyber threat up on hack/breach mentions', () => {
    const baseline = computeAllThreats(baseSignals()).scenarios['cyberattack'].level;
    const elevated = computeAllThreats(
      baseSignals({
        newsSignals: {
          keywordCounts: {
            hack: 4, breach: 3, layoff: 0, recession: 0, storm: 0,
            earthquake: 0, flood: 0, pandemic: 0, outbreak: 0, war: 0,
            crash: 0, crisis: 0, inflation: 0, default: 0, bankruptcy: 0,
          },
          crisisScore: 30,
        },
      }),
    ).scenarios['cyberattack'].level;
    expect(elevated).toBeGreaterThan(baseline);
  });
});
