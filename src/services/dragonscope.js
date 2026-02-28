/**
 * DragonScope Integration Service
 * Connects ReadyState to DragonScope's market data API (port 3456).
 * Provides economic indicators, sentiment, and volatility data for
 * dynamic threat level computation.
 *
 * Gracefully degrades when DragonScope is offline — returns null signals
 * so ReadyState works standalone with static threat levels.
 */

const DS_BASE = 'http://localhost:3456';
const FETCH_TIMEOUT = 5000;
const CACHE_TTL = 60_000; // 1 minute

// In-memory cache
const cache = new Map();

async function fetchDS(category) {
  const cached = cache.get(category);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(`${DS_BASE}/${category}.json`, {
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    cache.set(category, { data, ts: Date.now() });
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check if DragonScope is reachable
 */
export async function checkConnection() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${DS_BASE}/api/health`, { signal: controller.signal }).catch(() => null);
    clearTimeout(timer);
    // dataServer doesn't have /api/health, so try fetching _stats.json
    if (res && res.ok) return true;

    const controller2 = new AbortController();
    const timer2 = setTimeout(() => controller2.abort(), 3000);
    const res2 = await fetch(`${DS_BASE}/_stats.json`, { signal: controller2.signal });
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
export async function fetchMarketSignals() {
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

  // If nothing came back, DragonScope is offline
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
    lastCollected: stats?.lastRun || null,
    fetchedAt: Date.now(),
  };
}

// ─── Parsers (extract threat-relevant signals) ────────────────────

function parseEconomic(data) {
  if (!data) return null;
  // The collector stores economic data as { series_id: { values: [...], meta } }
  // Or it may be an array format. Handle both.
  const extract = (key) => {
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

function parseFearGreed(data) {
  if (!data) return null;
  // CoinGecko / Alternative.me format
  const val = data.data?.[0]?.value ?? data.value ?? data.fear_greed_value;
  const classification = data.data?.[0]?.value_classification ?? data.classification ?? '';
  return {
    value: Number(val) || 50,
    classification: classification || 'Neutral',
  };
}

function parseBonds(data) {
  if (!data) return null;
  // Yield curve: look for 2Y and 10Y spreads
  const yields = {};
  if (Array.isArray(data)) {
    for (const bond of data) {
      const maturity = bond.maturity || bond.name || '';
      const value = Number(bond.yield ?? bond.value ?? bond.rate) || 0;
      if (maturity.includes('2') && maturity.toLowerCase().includes('y')) yields['2Y'] = value;
      if (maturity.includes('10') && maturity.toLowerCase().includes('y')) yields['10Y'] = value;
      if (maturity.includes('30') && maturity.toLowerCase().includes('y')) yields['30Y'] = value;
    }
  } else if (data && typeof data === 'object') {
    // Object format { "DGS2": { values: [...] }, "DGS10": {...} }
    for (const [key, series] of Object.entries(data)) {
      const vals = series.values || series.data || [];
      const last = vals[vals.length - 1];
      const value = Number(last?.value ?? last) || 0;
      if (key.includes('2')) yields['2Y'] = value;
      if (key.includes('10')) yields['10Y'] = value;
      if (key.includes('30')) yields['30Y'] = value;
    }
  }

  const spread2s10s = (yields['10Y'] ?? 0) - (yields['2Y'] ?? 0);
  return {
    yields,
    spread2s10s,
    inverted: spread2s10s < 0,
  };
}

function parseCommodities(data) {
  if (!data) return null;
  const prices = {};
  if (Array.isArray(data)) {
    for (const item of data) {
      const name = (item.name || item.commodity || '').toLowerCase();
      prices[name] = Number(item.price ?? item.value) || 0;
    }
  } else if (data && typeof data === 'object') {
    for (const [key, series] of Object.entries(data)) {
      const vals = series.values || series.data || [];
      const last = vals[vals.length - 1];
      prices[key.toLowerCase()] = Number(last?.value ?? last) || 0;
    }
  }
  return prices;
}

function parseCrypto(data) {
  if (!data) return null;
  const d = data.data || data;
  return {
    totalMarketCap: d.total_market_cap?.usd ?? d.totalMarketCap ?? null,
    totalVolume: d.total_volume?.usd ?? d.totalVolume ?? null,
    btcDominance: d.market_cap_percentage?.btc ?? d.btcDominance ?? null,
    marketCapChange24h: d.market_cap_change_percentage_24h_usd ?? d.marketCapChange ?? null,
  };
}

function parseSentiment(data) {
  if (!data) return null;
  // Reddit sentiment format: { overall: { bullish, bearish, neutral }, posts: [...] }
  if (data.overall) {
    return {
      bullish: data.overall.bullish || 0,
      bearish: data.overall.bearish || 0,
      neutral: data.overall.neutral || 0,
    };
  }
  // Array of posts with sentiment
  if (Array.isArray(data)) {
    let bullish = 0, bearish = 0, neutral = 0;
    for (const post of data) {
      const s = (post.sentiment || '').toLowerCase();
      if (s === 'bullish') bullish++;
      else if (s === 'bearish') bearish++;
      else neutral++;
    }
    const total = data.length || 1;
    return {
      bullish: Math.round((bullish / total) * 100),
      bearish: Math.round((bearish / total) * 100),
      neutral: Math.round((neutral / total) * 100),
    };
  }
  return null;
}

function parseNews(data) {
  if (!data) return null;
  // Count crisis-related keywords in headlines
  const keywords = {
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

/**
 * Invalidate cache (force fresh fetch on next call)
 */
export function clearCache() {
  cache.clear();
}
