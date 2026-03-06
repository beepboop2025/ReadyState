import { createContext, useContext, useReducer, useEffect, useMemo, type ReactNode } from 'react';
import DOMAINS, { calcDomainScore, calcOverallScore } from './data/domains';
import { STORAGE_KEY, HISTORY_MAX_DAYS } from './config';
import type { AppState, AppAction, SerializedState, StoreContextValue, ScoresResult } from './types';

const StoreContext = createContext<StoreContextValue | null>(null);

function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: SerializedState = JSON.parse(raw);
    return {
      checkedIds: new Set(parsed.checkedIds || []),
      currentView: parsed.currentView || 'dashboard',
      sidebarOpen: parsed.sidebarOpen || false,
      userName: parsed.userName || '',
      householdSize: parsed.householdSize || 1,
      lastUpdated: parsed.lastUpdated || null,
      completionHistory: parsed.completionHistory || [],
      theme: parsed.theme || 'dark',
    };
  } catch {
    return null;
  }
}

function saveState(state: AppState): void {
  try {
    const serialized: SerializedState = {
      checkedIds: [...state.checkedIds],
      currentView: state.currentView,
      sidebarOpen: state.sidebarOpen,
      userName: state.userName,
      householdSize: state.householdSize,
      lastUpdated: state.lastUpdated,
      completionHistory: state.completionHistory,
      theme: state.theme,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // QuotaExceededError — silently fail
  }
}

const defaultState: AppState = {
  checkedIds: new Set(),
  currentView: 'dashboard',
  sidebarOpen: false,
  userName: '',
  householdSize: 1,
  lastUpdated: null,
  completionHistory: [],
  theme: 'dark',
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TOGGLE_ITEM': {
      const next = new Set(state.checkedIds);
      if (next.has(action.id)) {
        next.delete(action.id);
      } else {
        next.add(action.id);
      }
      return { ...state, checkedIds: next, lastUpdated: Date.now() };
    }
    case 'NAVIGATE':
      return { ...state, currentView: action.view, sidebarOpen: false };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'CLOSE_SIDEBAR':
      return { ...state, sidebarOpen: false };
    case 'SET_USER_NAME':
      return { ...state, userName: action.name };
    case 'SET_HOUSEHOLD_SIZE':
      return { ...state, householdSize: Math.max(1, Number(action.size) || 1) };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'RECORD_SNAPSHOT': {
      const today = new Date().toISOString().slice(0, 10);
      const existing = state.completionHistory.filter(h => h.date !== today);
      return {
        ...state,
        completionHistory: [...existing, { date: today, score: action.score }].slice(-HISTORY_MAX_DAYS),
      };
    }
    case 'IMPORT_DATA':
      return {
        ...state,
        ...action.data,
        checkedIds: new Set(action.data.checkedIds || []),
      };
    case 'RESET':
      return { ...defaultState, currentView: state.currentView };
    default:
      return state;
  }
}

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const saved = useMemo(() => loadState(), []);
  const [state, dispatch] = useReducer(reducer, saved || defaultState);

  // Persist on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Record daily snapshot
  useEffect(() => {
    const score = calcOverallScore(DOMAINS, state.checkedIds);
    dispatch({ type: 'RECORD_SNAPSHOT', score });
  }, [state.checkedIds]);

  // Theme class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function useScores(): ScoresResult {
  const { state } = useStore();
  return useMemo(() => {
    const domainScores: Record<string, number> = {};
    for (const d of DOMAINS) {
      domainScores[d.id] = calcDomainScore(d, state.checkedIds);
    }
    const overall = calcOverallScore(DOMAINS, state.checkedIds);
    return { domainScores, overall };
  }, [state.checkedIds]);
}
