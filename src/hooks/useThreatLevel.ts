import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMarketSignals } from '../services/dragonscope';
import { POLL_INTERVAL, THREAT_THRESHOLDS } from '../config';
import type {
  MarketSignals, ThreatData, OverallThreat, ScenarioThreat,
  ThreatLabel, ThreatFactor, ThreatHookResult,
  EconomicData, FearGreedData, BondsData, CommoditiesData,
  SentimentData, NewsSignals,
} from '../types';

/**
 * Maps DragonScope market signals to dynamic threat levels per scenario.
 *
 * Each scenario gets:
 *   - threatLevel (0–100): how elevated the real-world threat is right now
 *   - signals[]: human-readable reasons for the threat level
 *   - trend: 'rising' | 'stable' | 'falling'
 *
 * When DragonScope is offline, returns null (ReadyState falls back to static mode).
 */
export function useThreatLevel(): ThreatHookResult {
  const [data, setData] = useState<ThreatData | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const signals = await fetchMarketSignals();
      if (signals) {
        const threats = computeAllThreats(signals);
        setData(threats);
        setConnected(true);
        setLastUpdate(Date.now());
      } else {
        setConnected(false);
        setData(null);
      }
    } catch {
      setConnected(false);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  return { threats: data, connected, loading, lastUpdate, refresh };
}

// ─── Threat Computation Engine ─────────────────────────────────────

function computeAllThreats(signals: MarketSignals): ThreatData {
  const overallEnvironment = computeOverallEnvironment(signals);

  return {
    overall: overallEnvironment,
    scenarios: {
      'job-loss': computeJobLossThreat(signals.economic, signals.sentiment, signals.newsSignals),
      'natural-disaster': computeNaturalDisasterThreat(signals.newsSignals, signals.commodities),
      'cyberattack': computeCyberThreat(signals.newsSignals),
      'pandemic': computePandemicThreat(signals.newsSignals),
      'power-outage': computePowerOutageThreat(signals.commodities, signals.newsSignals),
      'medical-emergency': computeMedicalThreat(signals.economic, signals.newsSignals),
      'economic-crisis': computeEconomicCrisisThreat(signals.economic, signals.fearGreed, signals.bonds, signals.sentiment, signals.newsSignals),
      'forced-relocation': computeRelocationThreat(signals.newsSignals, signals.economic),
    },
    rawSignals: signals,
    computedAt: Date.now(),
  };
}

function computeOverallEnvironment(signals: MarketSignals): OverallThreat {
  const { economic, fearGreed, bonds, sentiment, newsSignals } = signals;
  let score = 30;
  const factors: ThreatFactor[] = [];

  if (fearGreed) {
    const fg = fearGreed.value;
    if (fg <= 20) { score += 25; factors.push({ text: `Extreme Fear (${fg}/100)`, impact: 'high' }); }
    else if (fg <= 35) { score += 15; factors.push({ text: `Fear (${fg}/100)`, impact: 'medium' }); }
    else if (fg >= 80) { score += 10; factors.push({ text: `Extreme Greed (${fg}/100) — bubble risk`, impact: 'medium' }); }
    else { factors.push({ text: `Market Sentiment: ${fearGreed.classification} (${fg}/100)`, impact: 'low' }); }
  }

  if (bonds) {
    if (bonds.inverted) {
      score += 20;
      factors.push({ text: `Yield curve INVERTED (${bonds.spread2s10s.toFixed(2)}%) — recession signal`, impact: 'high' });
    } else if (bonds.spread2s10s < 0.3) {
      score += 8;
      factors.push({ text: `Yield curve flattening (${bonds.spread2s10s.toFixed(2)}%)`, impact: 'medium' });
    }
  }

  if (economic?.unemployment != null) {
    const unemp = economic.unemployment;
    if (unemp > 6) { score += 15; factors.push({ text: `High unemployment (${unemp}%)`, impact: 'high' }); }
    else if (unemp > 4.5) { score += 8; factors.push({ text: `Rising unemployment (${unemp}%)`, impact: 'medium' }); }
    else { factors.push({ text: `Unemployment: ${unemp}%`, impact: 'low' }); }
  }

  if (economic?.cpi != null) {
    const cpi = economic.cpi;
    if (cpi > 5) { score += 12; factors.push({ text: `High inflation (CPI ${cpi})`, impact: 'high' }); }
    else if (cpi > 3.5) { score += 6; factors.push({ text: `Elevated inflation (CPI ${cpi})`, impact: 'medium' }); }
  }

  if (sentiment) {
    if (sentiment.bearish > 60) { score += 10; factors.push({ text: `Reddit sentiment heavily bearish (${sentiment.bearish}%)`, impact: 'medium' }); }
  }

  if (newsSignals) {
    if (newsSignals.crisisScore > 50) { score += 12; factors.push({ text: 'High crisis keyword density in news', impact: 'medium' }); }
    else if (newsSignals.crisisScore > 25) { score += 5; factors.push({ text: 'Moderate crisis signals in news', impact: 'low' }); }
  }

  return {
    level: clamp(score, 0, 100),
    label: threatLabel(score),
    factors,
  };
}

function computeJobLossThreat(economic: EconomicData | null, sentiment: SentimentData | null, news: NewsSignals | null): ScenarioThreat {
  let score = 20;
  const signals: string[] = [];

  if (economic?.unemployment != null) {
    const u = economic.unemployment;
    if (u > 6) { score += 30; signals.push(`Unemployment at ${u}% (high risk)`); }
    else if (u > 4.5) { score += 15; signals.push(`Unemployment rising to ${u}%`); }
    else { signals.push(`Unemployment stable at ${u}%`); }
  }

  if (economic?.gdp != null) {
    if (economic.gdp < 0) { score += 20; signals.push('GDP contracting — recession territory'); }
    else if (economic.gdp < 1) { score += 10; signals.push('GDP growth stagnating'); }
  }

  if (sentiment && sentiment.bearish > 50) { score += 10; signals.push('Market sentiment bearish — layoff risk elevated'); }

  if (news) {
    const layoffs = (news.keywordCounts.layoff || 0) + (news.keywordCounts.recession || 0);
    if (layoffs > 5) { score += 15; signals.push(`${layoffs} layoff/recession mentions in recent news`); }
    else if (layoffs > 2) { score += 7; signals.push('Moderate layoff news activity'); }
  }

  return { level: clamp(score, 0, 100), label: threatLabel(score), signals };
}

function computeNaturalDisasterThreat(news: NewsSignals | null, commodities: CommoditiesData | null): ScenarioThreat {
  let score = 15;
  const signals: string[] = [];

  if (news) {
    const weather = (news.keywordCounts.storm || 0) + (news.keywordCounts.earthquake || 0) + (news.keywordCounts.flood || 0);
    if (weather > 5) { score += 25; signals.push(`${weather} natural disaster mentions in news`); }
    else if (weather > 2) { score += 12; signals.push('Elevated weather/disaster news activity'); }
  }

  if (commodities) {
    const gas = commodities.gasoline || commodities.natural_gas || 0;
    if (gas > 4) { score += 10; signals.push('High energy prices — infrastructure stress indicator'); }
  }

  if (signals.length === 0) signals.push('No elevated natural disaster signals detected');
  return { level: clamp(score, 0, 100), label: threatLabel(score), signals };
}

function computeCyberThreat(news: NewsSignals | null): ScenarioThreat {
  let score = 25;
  const signals: string[] = [];

  if (news) {
    const cyber = (news.keywordCounts.hack || 0) + (news.keywordCounts.breach || 0);
    if (cyber > 5) { score += 30; signals.push(`${cyber} hack/breach mentions — elevated threat`); }
    else if (cyber > 2) { score += 15; signals.push('Moderate cybersecurity news activity'); }
    else { signals.push('Low cybersecurity incident reporting'); }
  } else {
    signals.push('Baseline cyber risk (always present)');
  }

  return { level: clamp(score, 0, 100), label: threatLabel(score), signals };
}

function computePandemicThreat(news: NewsSignals | null): ScenarioThreat {
  let score = 10;
  const signals: string[] = [];

  if (news) {
    const health = (news.keywordCounts.pandemic || 0) + (news.keywordCounts.outbreak || 0);
    if (health > 5) { score += 35; signals.push(`${health} pandemic/outbreak mentions — high alert`); }
    else if (health > 2) { score += 15; signals.push('Moderate health crisis signals'); }
    else { signals.push('No elevated pandemic signals'); }
  } else {
    signals.push('Low baseline pandemic risk');
  }

  return { level: clamp(score, 0, 100), label: threatLabel(score), signals };
}

function computePowerOutageThreat(commodities: CommoditiesData | null, news: NewsSignals | null): ScenarioThreat {
  let score = 12;
  const signals: string[] = [];

  if (commodities) {
    const energy = commodities.natural_gas || commodities.wti || 0;
    if (energy > 80) { score += 20; signals.push('Energy prices extremely elevated — grid stress risk'); }
    else if (energy > 50) { score += 10; signals.push('High energy prices'); }
  }

  if (news) {
    const storms = news.keywordCounts.storm || 0;
    if (storms > 3) { score += 15; signals.push(`${storms} storm mentions — power disruption risk`); }
  }

  if (signals.length === 0) signals.push('Normal grid conditions');
  return { level: clamp(score, 0, 100), label: threatLabel(score), signals };
}

function computeMedicalThreat(economic: EconomicData | null, news: NewsSignals | null): ScenarioThreat {
  let score = 15;
  const signals: string[] = [];

  if (economic?.unemployment != null && economic.unemployment > 5) {
    score += 10;
    signals.push('High unemployment — potential insurance gaps');
  }

  if (news) {
    const health = (news.keywordCounts.pandemic || 0) + (news.keywordCounts.outbreak || 0);
    if (health > 3) { score += 12; signals.push('Elevated health crisis in news'); }
  }

  if (signals.length === 0) signals.push('Baseline medical emergency risk');
  return { level: clamp(score, 0, 100), label: threatLabel(score), signals };
}

function computeEconomicCrisisThreat(
  economic: EconomicData | null,
  fearGreed: FearGreedData | null,
  bonds: BondsData | null,
  sentiment: SentimentData | null,
  news: NewsSignals | null,
): ScenarioThreat {
  let score = 15;
  const signals: string[] = [];

  if (bonds?.inverted) {
    score += 25;
    signals.push(`Yield curve INVERTED (${bonds.spread2s10s.toFixed(2)}%) — strongest recession predictor`);
  } else if (bonds && bonds.spread2s10s < 0.3) {
    score += 12;
    signals.push('Yield curve nearly flat — caution warranted');
  }

  if (fearGreed) {
    if (fearGreed.value <= 20) { score += 20; signals.push(`Extreme Fear (${fearGreed.value}) — market panic`); }
    else if (fearGreed.value <= 35) { score += 10; signals.push(`Fear sentiment (${fearGreed.value})`); }
  }

  if (economic?.gdp != null) {
    if (economic.gdp < 0) { score += 20; signals.push('GDP contracting'); }
    else if (economic.gdp < 1) { score += 8; signals.push('GDP growth stagnating'); }
  }

  if (economic?.fedFundsRate != null && economic.fedFundsRate > 5) {
    score += 10;
    signals.push(`High Fed Funds Rate (${economic.fedFundsRate}%) — tight monetary policy`);
  }

  if (sentiment && sentiment.bearish > 55) {
    score += 8;
    signals.push(`Bearish market sentiment (${sentiment.bearish}%)`);
  }

  if (news) {
    const crisis = (news.keywordCounts.recession || 0) + (news.keywordCounts.crash || 0) + (news.keywordCounts.crisis || 0);
    if (crisis > 5) { score += 12; signals.push(`${crisis} recession/crash/crisis mentions in news`); }
  }

  return { level: clamp(score, 0, 100), label: threatLabel(score), signals };
}

function computeRelocationThreat(news: NewsSignals | null, economic: EconomicData | null): ScenarioThreat {
  let score = 8;
  const signals: string[] = [];

  if (news) {
    const reloc = (news.keywordCounts.war || 0) + (news.keywordCounts.flood || 0) +
                  (news.keywordCounts.earthquake || 0) + (news.keywordCounts.storm || 0);
    if (reloc > 5) { score += 25; signals.push(`${reloc} conflict/disaster mentions — displacement risk`); }
    else if (reloc > 2) { score += 12; signals.push('Moderate displacement risk signals'); }
  }

  if (economic?.unemployment != null && economic.unemployment > 6) {
    score += 8;
    signals.push('High unemployment — economic displacement risk');
  }

  if (signals.length === 0) signals.push('Low forced relocation risk');
  return { level: clamp(score, 0, 100), label: threatLabel(score), signals };
}

// ─── Utilities ────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function threatLabel(score: number): ThreatLabel {
  if (score >= THREAT_THRESHOLDS.CRITICAL) return 'Critical';
  if (score >= THREAT_THRESHOLDS.ELEVATED) return 'Elevated';
  if (score >= THREAT_THRESHOLDS.MODERATE) return 'Moderate';
  if (score >= THREAT_THRESHOLDS.LOW) return 'Low';
  return 'Minimal';
}

/**
 * Compute "Effective Risk" — combines personal readiness with threat environment.
 * High threat + low readiness = high effective risk.
 * Low threat + high readiness = low effective risk.
 */
export function computeEffectiveRisk(readinessScore: number, threatLevel: number): number {
  return Math.round(threatLevel * (1 - readinessScore / 100));
}
