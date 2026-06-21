/**
 * DragonScope Integration Service
 * Connects ReadyState to DragonScope's market data API.
 * Provides economic indicators, sentiment, and volatility data for
 * dynamic threat level computation.
 *
 * Gracefully degrades when DragonScope is offline — returns null signals
 * so ReadyState works standalone with static threat levels.
 */

import { DRAGONSCOPE_URL, FETCH_TIMEOUT, CACHE_TTL } from '../config';
import type {
  MarketSignals, EconomicData, FearGreedData, BondsData,
  CommoditiesData, CryptoData, SentimentData, NewsSignals,
} from '../types';

// In-memory cache
const cache = new Map<string, { data: unknown; ts: number }>();

async function fetchDS(category: string): Promise<unknown | null> {
  const cached = cache.get(category);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(`${DRAGONSCOPE_URL}/${category}.json`, {
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    cache.set(category, { data, ts: Date.now() });
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Check if DragonScope is reachable */
export async function checkConnection(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${DRAGONSCOPE_URL}/api/health`, { signal: controller.signal }).catch(() => null);
    clearTimeout(timer);
    if (res && res.ok) return true;

    const controller2 = new AbortController();
    const timer2 = setTimeout(() => controller2.abort(), 3000);
    const res2 = await fetch(`${DRAGONSCOPE_URL}/_stats.json`, { signal: controller2.signal });
    clearTimeout(timer2);
    return res2.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch all market signals needed for threat level computation.
 * Returns a structured object or null if DragonScope is offline.
 */
export async function fetchMarketSignals(): Promise<MarketSignals | null> {
  const [economic, fearGreed, bonds, commodities, cryptoGlobal, redditSentiment, news, stats] =
    await Promise.all([
      fetchDS('economic'),
      fetchDS('fear_greed'),
      fetchDS('bonds'),
      fetchDS('commodities'),
      fetchDS('crypto_global'),
      fetchDS('reddit_sentiment'),
      fetchDS('news'),
      fetchDS('_stats'),
    ]);

  const hasAny = [economic, fearGreed, bonds, commodities, cryptoGlobal].some(Boolean);
  if (!hasAny) return null;

  return {
    economic: parseEconomic(economic),
    fearGreed: parseFearGreed(fearGreed),
    bonds: parseBonds(bonds),
    commodities: parseCommodities(commodities),
    crypto: parseCrypto(cryptoGlobal),
    sentiment: parseSentiment(redditSentiment),
    newsSignals: parseNews(news),
    lastCollected: (stats as Record<string, string> | null)?.lastRun || null,
    fetchedAt: Date.now(),
  };
}

// ─── Parsers (extract threat-relevant signals) ────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
export function parseEconomic(data: any): EconomicData | null {
  if (!data) return null;
  const extract = (key: string): number | null => {
    const series = data[key] || data[key?.toUpperCase()];
    if (!series) return null;
    const vals = series.values || series.data || series;
    if (Array.isArray(vals) && vals.length > 0) {
      const last = vals[vals.length - 1];
      const num = Number(last.value ?? last.v ?? last);
      return Number.isFinite(num) ? num : null;
    }
    return null;
  };

  return {
    gdp: extract('GDP') ?? extract('gdp'),
    cpi: extract('CPIAUCSL') ?? extract('cpi'),
    unemployment: extract('UNRATE') ?? extract('unemployment'),
    fedFundsRate: extract('FEDFUNDS') ?? extract('fed_funds_rate'),
    retailSales: extract('RSAFS') ?? extract('retail_sales'),
    housingStarts: extract('HOUST') ?? extract('housing_starts'),
  };
}

export function parseFearGreed(data: any): FearGreedData | null {
  if (!data) return null;
  const val = data.data?.[0]?.value ?? data.value ?? data.fear_greed_value;
  const classification = data.data?.[0]?.value_classification ?? data.classification ?? '';
  return {
    value: Number.isFinite(Number(val)) ? Number(val) : 50,
    classification: classification || 'Neutral',
  };
}

export function parseBonds(data: any): BondsData | null {
  if (!data) return null;
  const yields: Record<string, number> = {};
  if (Array.isArray(data)) {
    for (const bond of data) {
      const maturity = bond.maturity || bond.name || '';
      const value = Number(bond.yield ?? bond.value ?? bond.rate) || 0;
      if (maturity.includes('2') && maturity.toLowerCase().includes('y')) yields['2Y'] = value;
      if (maturity.includes('10') && maturity.toLowerCase().includes('y')) yields['10Y'] = value;
      if (maturity.includes('30') && maturity.toLowerCase().includes('y')) yields['30Y'] = value;
    }
  } else if (data && typeof data === 'object') {
    for (const [key, series] of Object.entries(data) as [string, any][]) {
      const vals = series.values || series.data || [];
      const last = vals[vals.length - 1];
      const value = Number(last?.value ?? last) || 0;
      if (key.includes('2Y') || key === 'GS2') yields['2Y'] = value;
      if (key.includes('10Y') || key === 'GS10') yields['10Y'] = value;
      if (key.includes('30Y') || key === 'GS30') yields['30Y'] = value;
    }
  }

  const spread2s10s = (yields['10Y'] ?? 0) - (yields['2Y'] ?? 0);
  return {
    yields,
    spread2s10s,
    inverted: spread2s10s < 0,
  };
}

export function parseCommodities(data: any): CommoditiesData | null {
  if (!data) return null;
  const prices: CommoditiesData = {};
  if (Array.isArray(data)) {
    for (const item of data) {
      const name = (item.name || item.commodity || '').toLowerCase();
      prices[name] = Number(item.price ?? item.value) || 0;
    }
  } else if (data && typeof data === 'object') {
    for (const [key, series] of Object.entries(data) as [string, any][]) {
      const vals = series.values || series.data || [];
      const last = vals[vals.length - 1];
      prices[key.toLowerCase()] = Number(last?.value ?? last) || 0;
    }
  }
  return prices;
}

export function parseCrypto(data: any): CryptoData | null {
  if (!data) return null;
  const d = data.data || data;
  return {
    totalMarketCap: d.total_market_cap?.usd ?? d.totalMarketCap ?? null,
    totalVolume: d.total_volume?.usd ?? d.totalVolume ?? null,
    btcDominance: d.market_cap_percentage?.btc ?? d.btcDominance ?? null,
    marketCapChange24h: d.market_cap_change_percentage_24h_usd ?? d.marketCapChange ?? null,
  };
}

export function parseSentiment(data: any): SentimentData | null {
  if (!data) return null;
  if (data.overall) {
    return {
      bullish: data.overall.bullish || 0,
      bearish: data.overall.bearish || 0,
      neutral: data.overall.neutral || 0,
    };
  }
  if (Array.isArray(data)) {
    let bullish = 0, bearish = 0, neutral = 0;
    for (const post of data) {
      const s = (post.sentiment || '').toLowerCase();
      if (s === 'bullish') bullish++;
      else if (s === 'bearish') bearish++;
      else neutral++;
    }
    const total = data.length || 1;
    const bullishPct = Math.round((bullish / total) * 100);
    const bearishPct = Math.round((bearish / total) * 100);
    return {
      bullish: bullishPct,
      bearish: bearishPct,
      neutral: 100 - bullishPct - bearishPct,
    };
  }
  return null;
}

export function parseNews(data: any): NewsSignals | null {
  if (!data) return null;
  const keywords: Record<string, number> = {
    recession: 0, layoff: 0, crash: 0, crisis: 0, war: 0,
    inflation: 0, default: 0, bankruptcy: 0, hack: 0, breach: 0,
    pandemic: 0, outbreak: 0, storm: 0, earthquake: 0, flood: 0,
  };

  const articles = data.articles || data.results || data;
  if (!Array.isArray(articles)) return { keywordCounts: keywords, crisisScore: 0 };

  for (const article of articles) {
    const text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
    for (const kw of Object.keys(keywords)) {
      if (text.includes(kw)) keywords[kw]++;
    }
  }

  const totalMentions = Object.values(keywords).reduce((a, b) => a + b, 0);
  const articleCount = articles.length || 1;
  const crisisScore = Math.min(100, Math.round((totalMentions / articleCount) * 100));

  return { keywordCounts: keywords, crisisScore };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Invalidate cache (force fresh fetch on next call) */
export function clearCache(): void {
  cache.clear();
}
