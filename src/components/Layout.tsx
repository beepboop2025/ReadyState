import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { useStore, useScores } from '../store';
import DOMAINS, { getAllItems } from '../data/domains';
import { SCORE_THRESHOLDS } from '../config';
import type { ViewId, FlatItem } from '../types';
import {
  LayoutDashboard, AlertTriangle, Settings, Menu, X, Shield, ChevronRight,
  Search as SearchIcon,
} from 'lucide-react';

interface NavItem {
  id: ViewId;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color?: string;
  domainId?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ...DOMAINS.map(d => ({ id: `domain:${d.id}` as ViewId, label: d.name, icon: d.icon, color: d.color, domainId: d.id })),
  { id: 'scenarios', label: 'Scenarios', icon: AlertTriangle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface ScorePillProps {
  score: number;
  size?: 'sm' | 'md';
}

function ScorePill({ score, size = 'sm' }: ScorePillProps) {
  const color =
    score >= SCORE_THRESHOLDS.STRONG ? 'text-emerald-400 bg-emerald-500/10' :
    score >= SCORE_THRESHOLDS.MODERATE ? 'text-yellow-400 bg-yellow-500/10' :
    score >= SCORE_THRESHOLDS.DEVELOPING ? 'text-amber-400 bg-amber-500/10' :
                  'text-rose-400 bg-rose-500/10';
  const sz = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  return (
    <span className={`${color} ${sz} rounded-full font-semibold score-label backdrop-blur-sm transition-all duration-500`}>
      {score}%
    </span>
  );
}

interface SearchResultProps {
  item: FlatItem;
  onSelect: () => void;
}

function SearchResult({ item, onSelect }: SearchResultProps) {
  const domain = DOMAINS.find(d => d.id === item.domainId);
  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-4 py-3 hover:bg-th-card-alt/60 transition-all duration-200
                 flex items-center gap-3 group"
    >
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-125"
        style={{ background: domain?.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-th-body truncate">{item.text}</p>
        <p className="text-xs text-th-faint">{domain?.name} &middot; {item.category}</p>
      </div>
    </button>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { state, dispatch } = useStore();
  const { domainScores, overall } = useScores();
  const { currentView, sidebarOpen } = state;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<number>(0);
  const [viewKey, setViewKey] = useState(0);
  const prevViewRef = useRef(currentView);

  // Trigger page transition on view change
  useEffect(() => {
    if (prevViewRef.current !== currentView) {
      setViewKey(k => k + 1);
      prevViewRef.current = currentView;
    }
  }, [currentView]);

  const scoreColor =
    overall >= SCORE_THRESHOLDS.STRONG ? 'from-emerald-500 to-emerald-400' :
    overall >= SCORE_THRESHOLDS.MODERATE ? 'from-yellow-500 to-yellow-400' :
    overall >= SCORE_THRESHOLDS.DEVELOPING ? 'from-amber-500 to-amber-400' :
                    'from-rose-500 to-rose-400';

  const scoreGlow =
    overall >= SCORE_THRESHOLDS.STRONG ? 'shadow-emerald-500/30' :
    overall >= SCORE_THRESHOLDS.MODERATE ? 'shadow-yellow-500/30' :
    overall >= SCORE_THRESHOLDS.DEVELOPING ? 'shadow-amber-500/30' :
                    'shadow-rose-500/30';

  // Global search results
  const allItems = useMemo(() => getAllItems(), []);
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return allItems.filter(i =>
      i.text.toLowerCase().includes(q) || i.tips.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [allItems, searchQuery]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
      } else if (sidebarOpen) {
        dispatch({ type: 'CLOSE_SIDEBAR' });
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(prev => !prev);
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [dispatch, sidebarOpen, searchOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Swipe to close sidebar on mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (diff > 80 && sidebarOpen) {
      dispatch({ type: 'CLOSE_SIDEBAR' });
    }
  }, [dispatch, sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-th-page">
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`
          fixed inset-0 z-40 lg:hidden transition-all duration-300
          ${sidebarOpen ? 'bg-black/50 backdrop-blur-sm opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => dispatch({ type: 'CLOSE_SIDEBAR' })}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 glass-sidebar
          flex flex-col
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-th-border/40">
          <div className={`
            w-10 h-10 rounded-xl bg-gradient-to-br ${scoreColor}
            flex items-center justify-center
            shadow-lg ${scoreGlow}
            transition-all duration-500
          `}>
            <Shield className="w-5 h-5 text-white drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-th-heading tracking-tight">ReadyState</h1>
            <p className="text-[10px] text-th-faint font-semibold tracking-[0.15em] uppercase">
              Resilience Intelligence
            </p>
          </div>
          <button
            className="ml-auto lg:hidden text-th-muted hover:text-th-heading transition-colors duration-200
                       p-1.5 rounded-lg hover:bg-th-card-alt/40"
            onClick={() => dispatch({ type: 'CLOSE_SIDEBAR' })}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overall Score Mini */}
        <div className="px-5 py-4 border-b border-th-border/30">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] text-th-faint font-semibold uppercase tracking-[0.12em]">
              Overall Readiness
            </span>
            <ScorePill score={overall} />
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={overall}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall readiness"
          >
            <div
              className={`progress-fill bg-gradient-to-r ${scoreColor}`}
              style={{ width: `${overall}%` }}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            const domainScore = item.domainId ? domainScores[item.domainId] : null;

            return (
              <button
                key={item.id}
                onClick={() => dispatch({ type: 'NAVIGATE', view: item.id })}
                className={`
                  nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 ease-out group relative overflow-hidden
                  ${isActive
                    ? 'bg-th-input/70 text-th-heading shadow-sm'
                    : 'text-th-muted hover:text-th-heading hover:bg-th-card-alt/30'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full
                               bg-gradient-to-b from-emerald-400 to-emerald-500
                               animate-nav-indicator
                               shadow-sm shadow-emerald-500/50"
                  />
                )}

                {/* Active background glow */}
                {isActive && item.color && (
                  <div
                    className="absolute inset-0 opacity-[0.04] rounded-xl transition-opacity duration-500"
                    style={{ background: item.color }}
                  />
                )}

                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 transition-all duration-200 relative z-10 ${
                    isActive ? 'scale-105' : 'group-hover:scale-110'
                  }`}
                  style={item.color ? { color: isActive ? item.color : undefined } : undefined}
                />
                <span className="flex-1 text-left relative z-10">{item.label}</span>
                {domainScore !== null && <ScorePill score={domainScore} />}
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-th-faint transition-transform duration-200" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-th-border/30">
          <p className="text-[10px] text-th-faint/70 text-center font-medium">
            Your data stays on your device.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-8 py-4
                           border-b border-th-border/30
                           bg-th-page/70 backdrop-blur-xl">
          <button
            className="lg:hidden text-th-muted hover:text-th-heading p-1.5 rounded-lg
                       hover:bg-th-card-alt/40 transition-all duration-200"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100); }}
              className="flex items-center gap-2 w-full px-3.5 py-2 rounded-xl text-sm text-th-faint
                         bg-th-card/50 border border-th-border/40
                         hover:border-th-border-alt/60 hover:bg-th-card/70
                         transition-all duration-200 backdrop-blur-sm"
            >
              <SearchIcon className="w-4 h-4" />
              <span className="flex-1 text-left">Search items...</span>
              <kbd className="hidden sm:inline text-[10px] text-th-faint/70 bg-th-input/70 px-1.5 py-0.5 rounded-md font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Search Dropdown */}
            {searchOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} />
                <div className="absolute top-full left-0 right-0 mt-2 z-50
                                card shadow-2xl overflow-hidden
                                animate-slide-in-right">
                  <div className="p-3 border-b border-th-border/30">
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search checklist items..."
                      className="w-full bg-transparent text-sm text-th-heading placeholder-th-faint focus:outline-none"
                      autoFocus
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="max-h-72 overflow-y-auto">
                      {searchResults.map(item => (
                        <SearchResult
                          key={item.id}
                          item={item}
                          onSelect={() => {
                            dispatch({ type: 'NAVIGATE', view: `domain:${item.domainId}` });
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 2 && searchResults.length === 0 && (
                    <div className="p-5 text-center text-sm text-th-faint">No items found.</div>
                  )}
                </div>
              </>
            )}
          </div>

          {state.userName && (
            <span className="text-sm text-th-faint hidden md:inline">
              Hello, <span className="text-th-body font-medium">{state.userName}</span>
            </span>
          )}
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-th-faint hidden sm:inline font-medium">Readiness</span>
            <div className={`
              px-3.5 py-1.5 rounded-full font-bold text-sm score-label
              bg-gradient-to-r ${scoreColor} text-white
              shadow-lg ${scoreGlow}
              transition-all duration-500
            `}>
              {overall}%
            </div>
          </div>
        </header>

        {/* Page Content with transition */}
        <div className="flex-1 overflow-y-auto">
          <div key={viewKey} className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8 page-enter">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
