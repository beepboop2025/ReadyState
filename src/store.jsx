import { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import DOMAINS, { calcDomainScore, calcOverallScore } from './data/domains';

const STORAGE_KEY = 'readystate-data';

const StoreContext = createContext(null);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      checkedIds: new Set(parsed.checkedIds || []),
    };
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      checkedIds: [...state.checkedIds],
    }));
  } catch {
    // QuotaExceededError — silently fail
  }
}

const defaultState = {
  checkedIds: new Set(),
  currentView: 'dashboard',      // dashboard | domain:<id> | scenarios | settings
  sidebarOpen: false,
  userName: '',
  householdSize: 1,
  lastUpdated: null,
  completionHistory: [],          // [{ date, score }] — daily snapshots
  theme: 'dark',
};

function reducer(state, action) {
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
        completionHistory: [...existing, { date: today, score: action.score }].slice(-90),
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

export function StoreProvider({ children }) {
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

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function useScores() {
  const { state } = useStore();
  return useMemo(() => {
    const domainScores = {};
    for (const d of DOMAINS) {
      domainScores[d.id] = calcDomainScore(d, state.checkedIds);
    }
    const overall = calcOverallScore(DOMAINS, state.checkedIds);
    return { domainScores, overall };
  }, [state.checkedIds]);
}
