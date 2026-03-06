import type { LucideIcon } from 'lucide-react';

// ─── Domain Model ─────────────────────────────────────────────────

export interface DomainItem {
  id: string;
  text: string;
  weight: 1 | 2 | 3;
  tips: string;
}

export interface DomainCategory {
  name: string;
  items: DomainItem[];
}

export interface Domain {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  colorLight: string;
  colorBg: string;
  description: string;
  categories: DomainCategory[];
}

// Flat item with domain context attached
export interface FlatItem extends DomainItem {
  domainId: string;
  category: string;
}

export interface ActionItem extends FlatItem {
  domainName: string;
  domainColor: string;
}

// ─── Scenario Model ───────────────────────────────────────────────

export interface ScenarioImpact {
  weight: number;
  reason: string;
}

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface Scenario {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  severity: SeverityLevel;
  description: string;
  impacts: Record<string, ScenarioImpact>;
  criticalItems: string[];
  tips: string[];
}

// ─── Store / State ────────────────────────────────────────────────

export type ViewId = 'dashboard' | `domain:${string}` | 'scenarios' | 'settings';
export type Theme = 'dark' | 'light';

export interface HistoryEntry {
  date: string;
  score: number;
}

export interface AppState {
  checkedIds: Set<string>;
  currentView: ViewId;
  sidebarOpen: boolean;
  userName: string;
  householdSize: number;
  lastUpdated: number | null;
  completionHistory: HistoryEntry[];
  theme: Theme;
}

export type AppAction =
  | { type: 'TOGGLE_ITEM'; id: string }
  | { type: 'NAVIGATE'; view: ViewId }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'CLOSE_SIDEBAR' }
  | { type: 'SET_USER_NAME'; name: string }
  | { type: 'SET_HOUSEHOLD_SIZE'; size: string | number }
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'RECORD_SNAPSHOT'; score: number }
  | { type: 'IMPORT_DATA'; data: SerializedState }
  | { type: 'RESET' };

// What gets saved to / loaded from localStorage
export interface SerializedState {
  checkedIds: string[];
  currentView?: ViewId;
  sidebarOpen?: boolean;
  userName?: string;
  householdSize?: number;
  lastUpdated?: number | null;
  completionHistory?: HistoryEntry[];
  theme?: Theme;
  version?: number;
  exportedAt?: string;
}

export interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export interface DomainScores {
  [domainId: string]: number;
}

export interface ScoresResult {
  domainScores: DomainScores;
  overall: number;
}

// ─── DragonScope / Market Data ────────────────────────────────────

export interface EconomicData {
  gdp: number | null;
  cpi: number | null;
  unemployment: number | null;
  fedFundsRate: number | null;
  retailSales: number | null;
  housingStarts: number | null;
}

export interface FearGreedData {
  value: number;
  classification: string;
}

export interface BondsData {
  yields: Record<string, number>;
  spread2s10s: number;
  inverted: boolean;
}

export type CommoditiesData = Record<string, number>;

export interface CryptoData {
  totalMarketCap: number | null;
  totalVolume: number | null;
  btcDominance: number | null;
  marketCapChange24h: number | null;
}

export interface SentimentData {
  bullish: number;
  bearish: number;
  neutral: number;
}

export interface NewsSignals {
  keywordCounts: Record<string, number>;
  crisisScore: number;
}

export interface MarketSignals {
  economic: EconomicData | null;
  fearGreed: FearGreedData | null;
  bonds: BondsData | null;
  commodities: CommoditiesData | null;
  crypto: CryptoData | null;
  sentiment: SentimentData | null;
  newsSignals: NewsSignals | null;
  lastCollected: string | null;
  fetchedAt: number;
}

// ─── Threat Engine ────────────────────────────────────────────────

export type ThreatLabel = 'Critical' | 'Elevated' | 'Moderate' | 'Low' | 'Minimal';
export type ImpactLevel = 'high' | 'medium' | 'low';

export interface ThreatFactor {
  text: string;
  impact: ImpactLevel;
}

export interface OverallThreat {
  level: number;
  label: ThreatLabel;
  factors: ThreatFactor[];
}

export interface ScenarioThreat {
  level: number;
  label: ThreatLabel;
  signals: string[];
}

export interface ThreatData {
  overall: OverallThreat;
  scenarios: Record<string, ScenarioThreat>;
  rawSignals: MarketSignals;
  computedAt: number;
}

export interface ThreatHookResult {
  threats: ThreatData | null;
  connected: boolean;
  loading: boolean;
  lastUpdate: number | null;
  refresh: () => Promise<void>;
}

// ─── UI Helpers ───────────────────────────────────────────────────

export interface ScoreConfig {
  color: string;
  glow: string;
  label: string;
  gradient: [string, string];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  duration?: number;
}
