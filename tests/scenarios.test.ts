import { describe, it, expect } from 'vitest';
import SCENARIOS, { calcScenarioScore } from '../src/data/scenarios';
import type { Scenario, DomainScores } from '../src/types';

const jobLoss = SCENARIOS.find((s) => s.id === 'job-loss') as Scenario;

const allSixZero: DomainScores = {
  financial: 0, supplies: 0, digital: 0, health: 0, skills: 0, network: 0,
};
const allSixFull: DomainScores = {
  financial: 100, supplies: 100, digital: 100, health: 100, skills: 100, network: 100,
};

describe('scenario data integrity', () => {
  it('has unique scenario ids and a valid severity each', () => {
    const ids = SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SCENARIOS) {
      expect(['critical', 'high', 'medium', 'low']).toContain(s.severity);
    }
  });

  it('every scenario impact map sums to 1.0 (weighted average is well-formed)', () => {
    for (const s of SCENARIOS) {
      const sum = Object.values(s.impacts).reduce((acc, i) => acc + i.weight, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });
});

describe('calcScenarioScore', () => {
  it('is 0 when all domain scores are 0', () => {
    expect(calcScenarioScore(jobLoss, allSixZero)).toBe(0);
  });

  it('is 100 when all relevant domains are fully prepared', () => {
    expect(calcScenarioScore(jobLoss, allSixFull)).toBe(100);
  });

  it('computes the weighted average of contributing domains', () => {
    // job-loss weights: financial .40, skills .25, network .20, health .10, digital .05
    const scores: DomainScores = {
      financial: 80, skills: 40, network: 100, health: 0, digital: 60, supplies: 0,
    };
    const expected = Math.round(
      80 * 0.4 + 40 * 0.25 + 100 * 0.2 + 0 * 0.1 + 60 * 0.05,
    );
    expect(calcScenarioScore(jobLoss, scores)).toBe(expected);
  });

  it('treats a missing domain score as 0 rather than NaN', () => {
    const partial = { financial: 100 } as DomainScores;
    const result = calcScenarioScore(jobLoss, partial);
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBe(Math.round(100 * 0.4));
  });

  it('ignores domains whose impact weight is exactly 0', () => {
    // supplies has weight 0 for job-loss, so changing it must not move the score.
    const withSupplies: DomainScores = { ...allSixZero, supplies: 100 };
    expect(calcScenarioScore(jobLoss, withSupplies)).toBe(0);
  });
});
