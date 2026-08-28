import { describe, it, expect } from 'vitest';
import {
  parseEconomic,
  parseFearGreed,
  parseBonds,
  parseCommodities,
  parseCrypto,
  parseSentiment,
  parseNews,
} from '../src/services/dragonscope';

describe('parseEconomic', () => {
  it('returns null for null input', () => {
    expect(parseEconomic(null)).toBeNull();
  });

  it('extracts the latest value from a {values:[{value}]} series', () => {
    const result = parseEconomic({
      UNRATE: { values: [{ value: 3.9 }, { value: 4.1 }] },
      CPIAUCSL: { values: [{ value: 305 }, { value: 311 }] },
    });
    expect(result?.unemployment).toBe(4.1);
    expect(result?.cpi).toBe(311);
    expect(result?.gdp).toBeNull();
  });

  it('falls back to lowercase keys and the {data:[{v}]} series shape', () => {
    const result = parseEconomic({
      gdp: { values: [{ value: 2.1 }, { value: 2.4 }] },
      fed_funds_rate: { data: [{ v: 5.25 }] },
    });
    expect(result?.gdp).toBe(2.4);
    expect(result?.fedFundsRate).toBe(5.25);
  });

  it('returns null for a non-finite trailing value', () => {
    expect(parseEconomic({ GDP: { values: [{ value: 'oops' }] } })?.gdp).toBeNull();
  });
});

describe('parseFearGreed', () => {
  it('reads the CNN-style nested data array', () => {
    const r = parseFearGreed({ data: [{ value: '18', value_classification: 'Extreme Fear' }] });
    expect(r).toEqual({ value: 18, classification: 'Extreme Fear' });
  });

  it('defaults to a neutral 50 when the value is unparseable', () => {
    const r = parseFearGreed({ value: 'n/a' });
    expect(r?.value).toBe(50);
    expect(r?.classification).toBe('Neutral');
  });
});

describe('parseBonds', () => {
  it('computes the 2s10s spread and flags inversion from an array', () => {
    const r = parseBonds([
      { maturity: '2Y', yield: 5.0 },
      { maturity: '10Y', yield: 4.2 },
    ]);
    expect(r?.yields['2Y']).toBe(5.0);
    expect(r?.yields['10Y']).toBe(4.2);
    expect(r?.spread2s10s).toBeCloseTo(-0.8, 5);
    expect(r?.inverted).toBe(true);
  });

  it('reads object form keyed by GS2/GS10 series and reports a normal curve', () => {
    const r = parseBonds({
      GS2: { values: [{ value: 4.0 }] },
      GS10: { values: [{ value: 4.5 }] },
    });
    expect(r?.spread2s10s).toBeCloseTo(0.5, 5);
    expect(r?.inverted).toBe(false);
  });
});

describe('parseCommodities', () => {
  it('lower-cases names from an array of {name, price}', () => {
    const r = parseCommodities([
      { name: 'Gasoline', price: 3.5 },
      { commodity: 'WTI', value: 78 },
    ]);
    expect(r?.gasoline).toBe(3.5);
    expect(r?.wti).toBe(78);
  });

  it('reads object form using the last series value', () => {
    const r = parseCommodities({ natural_gas: { data: [{ value: 2.1 }, { value: 2.8 }] } });
    expect(r?.natural_gas).toBe(2.8);
  });
});

describe('parseCrypto', () => {
  it('unwraps the CoinGecko global {data:{...}} shape', () => {
    const r = parseCrypto({
      data: {
        total_market_cap: { usd: 2_500_000_000 },
        total_volume: { usd: 90_000_000 },
        market_cap_percentage: { btc: 52.3 },
        market_cap_change_percentage_24h_usd: -1.7,
      },
    });
    expect(r?.totalMarketCap).toBe(2_500_000_000);
    expect(r?.btcDominance).toBe(52.3);
    expect(r?.marketCapChange24h).toBe(-1.7);
  });

  it('returns nulls for missing fields rather than throwing', () => {
    expect(parseCrypto({})).toEqual({
      totalMarketCap: null,
      totalVolume: null,
      btcDominance: null,
      marketCapChange24h: null,
    });
  });
});

describe('parseSentiment', () => {
  it('passes through a pre-aggregated overall object', () => {
    const r = parseSentiment({ overall: { bullish: 40, bearish: 35, neutral: 25 } });
    expect(r).toEqual({ bullish: 40, bearish: 35, neutral: 25 });
  });

  it('aggregates an array of posts into percentages that sum to 100', () => {
    const r = parseSentiment([
      { sentiment: 'bullish' },
      { sentiment: 'bullish' },
      { sentiment: 'bearish' },
      { sentiment: 'whatever' },
    ]);
    expect(r?.bullish).toBe(50);
    expect(r?.bearish).toBe(25);
    expect((r?.bullish ?? 0) + (r?.bearish ?? 0) + (r?.neutral ?? 0)).toBe(100);
  });
});

describe('parseNews', () => {
  it('counts crisis keywords case-insensitively across title and description', () => {
    const r = parseNews({
      articles: [
        { title: 'Major LAYOFF announced', description: 'amid recession fears' },
        { title: 'Cyber breach hits bank', description: 'a hack exposed data' },
        { title: 'Sunny weather', description: 'nothing to report' },
      ],
    });
    expect(r?.keywordCounts.layoff).toBe(1);
    expect(r?.keywordCounts.recession).toBe(1);
    expect(r?.keywordCounts.breach).toBe(1);
    expect(r?.keywordCounts.hack).toBe(1);
    expect(r?.crisisScore).toBeGreaterThan(0);
  });

  it('caps the crisis score at 100', () => {
    const articles = Array.from({ length: 1 }, () => ({
      title: 'war crash crisis hack breach pandemic outbreak storm flood earthquake',
      description: 'recession layoff inflation default bankruptcy',
    }));
    const r = parseNews({ articles });
    expect(r?.crisisScore).toBe(100);
  });

  it('returns a zeroed keyword map for non-array payloads', () => {
    const r = parseNews({ articles: 'not-an-array' });
    expect(r?.crisisScore).toBe(0);
    expect(Object.values(r?.keywordCounts ?? {}).every((v) => v === 0)).toBe(true);
  });
});
