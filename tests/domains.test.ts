import { describe, it, expect } from 'vitest';
import DOMAINS, {
  getAllItems,
  calcDomainScore,
  calcOverallScore,
  getActionItems,
} from '../src/data/domains';
import type { Domain } from '../src/types';

const financial = DOMAINS.find((d) => d.id === 'financial') as Domain;

describe('domain data integrity', () => {
  it('exposes six domains with unique ids', () => {
    expect(DOMAINS).toHaveLength(6);
    const ids = DOMAINS.map((d) => d.id);
    expect(new Set(ids).size).toBe(6);
  });

  it('every item has a unique id, valid weight (1-3) and tip text', () => {
    const items = getAllItems();
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of items) {
      expect([1, 2, 3]).toContain(item.weight);
      expect(item.tips.length).toBeGreaterThan(0);
      expect(item.domainId).toBeTruthy();
      expect(item.category).toBeTruthy();
    }
  });

  it('getAllItems flattens to the full catalogue', () => {
    expect(getAllItems()).toHaveLength(73);
  });
});

describe('calcDomainScore', () => {
  it('returns 0 when nothing is checked', () => {
    expect(calcDomainScore(financial, new Set())).toBe(0);
  });

  it('returns 100 when every item in the domain is checked', () => {
    const allIds = new Set(
      financial.categories.flatMap((c) => c.items.map((i) => i.id)),
    );
    expect(calcDomainScore(financial, allIds)).toBe(100);
  });

  it('is weighted: a weight-3 item contributes more than a weight-1 item', () => {
    const allItems = financial.categories.flatMap((c) => c.items);
    const totalWeight = allItems.reduce((s, i) => s + i.weight, 0);
    const w3 = allItems.find((i) => i.weight === 3)!;
    const w1 = allItems.find((i) => i.weight === 1)!;

    const scoreW3 = calcDomainScore(financial, new Set([w3.id]));
    const scoreW1 = calcDomainScore(financial, new Set([w1.id]));

    expect(scoreW3).toBeGreaterThan(scoreW1);
    expect(scoreW3).toBe(Math.round((3 / totalWeight) * 100));
    expect(scoreW1).toBe(Math.round((1 / totalWeight) * 100));
  });

  it('ignores checked ids that do not belong to the domain', () => {
    expect(calcDomainScore(financial, new Set(['does-not-exist', 'sup-01']))).toBe(0);
  });

  it('returns 0 for a domain with no items rather than dividing by zero', () => {
    const empty: Domain = { ...financial, categories: [] };
    expect(calcDomainScore(empty, new Set(['fin-01']))).toBe(0);
  });
});

describe('calcOverallScore', () => {
  it('averages the per-domain scores', () => {
    expect(calcOverallScore(DOMAINS, new Set())).toBe(0);

    const allIds = new Set(getAllItems().map((i) => i.id));
    expect(calcOverallScore(DOMAINS, allIds)).toBe(100);
  });

  it('equals the unweighted mean of domain scores', () => {
    const someChecked = new Set(['fin-01', 'fin-02']);
    const perDomain = DOMAINS.map((d) => calcDomainScore(d, someChecked));
    const expected = Math.round(perDomain.reduce((a, b) => a + b, 0) / perDomain.length);
    expect(calcOverallScore(DOMAINS, someChecked)).toBe(expected);
  });

  it('returns 0 for an empty domain list', () => {
    expect(calcOverallScore([], new Set(['fin-01']))).toBe(0);
  });
});

describe('getActionItems', () => {
  it('only returns unchecked items', () => {
    const checked = new Set(getAllItems().slice(0, 5).map((i) => i.id));
    const actions = getActionItems(DOMAINS, checked, 100);
    for (const a of actions) {
      expect(checked.has(a.id)).toBe(false);
    }
  });

  it('respects the limit', () => {
    expect(getActionItems(DOMAINS, new Set(), 3)).toHaveLength(3);
    expect(getActionItems(DOMAINS, new Set(), 8)).toHaveLength(8);
  });

  it('prioritises higher-weight items first', () => {
    const actions = getActionItems(DOMAINS, new Set(), 8);
    const weights = actions.map((a) => a.weight);
    const sorted = [...weights].sort((a, b) => b - a);
    expect(weights).toEqual(sorted);
    expect(weights[0]).toBe(3);
  });

  it('decorates items with their domain name and color', () => {
    const [first] = getActionItems(DOMAINS, new Set(), 1);
    const owner = DOMAINS.find((d) => d.id === first.domainId)!;
    expect(first.domainName).toBe(owner.name);
    expect(first.domainColor).toBe(owner.color);
  });

  it('returns nothing once everything is checked', () => {
    const allIds = new Set(getAllItems().map((i) => i.id));
    expect(getActionItems(DOMAINS, allIds)).toHaveLength(0);
  });
});
