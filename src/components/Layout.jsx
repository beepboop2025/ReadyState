import { useStore, useScores } from '../store';
import DOMAINS from '../data/domains';
import {
  LayoutDashboard, AlertTriangle, Settings, Menu, X, Shield, ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ...DOMAINS.map(d => ({ id: `domain:${d.id}`, label: d.name, icon: d.icon, color: d.color, domainId: d.id })),
  { id: 'scenarios', label: 'Scenarios', icon: AlertTriangle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function ScorePill({ score, size = 'sm' }) {
  const color =
    score >= 80 ? 'text-emerald-400 bg-emerald-500/10' :
    score >= 60 ? 'text-yellow-400 bg-yellow-500/10' :
    score >= 40 ? 'text-amber-400 bg-amber-500/10' :
                  'text-rose-400 bg-rose-500/10';
  const sz = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  return (
    <span className={`${color} ${sz} rounded-full font-semibold score-label`}>
      {score}%
    </span>
  );
}

export default function Layout({ children }) {
  const { state, dispatch } = useStore();
  const { domainScores, overall } = useScores();
  const { currentView, sidebarOpen } = state;

  const scoreColor =
    overall >= 80 ? 'from-emerald-500 to-emerald-400' :
    overall >= 60 ? 'from-yellow-500 to-yellow-400' :
    overall >= 40 ? 'from-amber-500 to-amber-400' :
                    'from-rose-500 to-rose-400';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => dispatch({ type: 'CLOSE_SIDEBAR' })}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-surface-900/95 backdrop-blur-xl border-r border-slate-800/60
        flex flex-col
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/60">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${scoreColor} flex items-center justify-center`}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">ReadyState</h1>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">Resilience Intelligence</p>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => dispatch({ type: 'CLOSE_SIDEBAR' })}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overall Score Mini */}
        <div className="px-5 py-4 border-b border-slate-800/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Overall Readiness</span>
            <ScorePill score={overall} />
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill bg-gradient-to-r ${scoreColor}`}
              style={{ width: `${overall}%` }}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            const domainScore = item.domainId ? domainScores[item.domainId] : null;

            return (
              <button
                key={item.id}
                onClick={() => dispatch({ type: 'NAVIGATE', view: item.id })}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 group
                  ${isActive
                    ? 'bg-slate-800/80 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }
                `}
              >
                <Icon
                  className="w-[18px] h-[18px] flex-shrink-0"
                  style={item.color ? { color: isActive ? item.color : undefined } : undefined}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {domainScore !== null && <ScorePill score={domainScore} />}
                {isActive && <ChevronRight className="w-4 h-4 text-slate-600" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800/40">
          <p className="text-[11px] text-slate-600 text-center">
            Your data stays on your device.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center gap-4 px-4 lg:px-8 py-4 border-b border-slate-800/40 bg-surface-950/80 backdrop-blur-sm">
          <button
            className="lg:hidden text-slate-400 hover:text-white p-1"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          {state.userName && (
            <span className="text-sm text-slate-500">
              Hello, <span className="text-slate-300 font-medium">{state.userName}</span>
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Readiness</span>
            <div className={`
              px-3 py-1.5 rounded-full font-bold text-sm score-label
              bg-gradient-to-r ${scoreColor} text-white
            `}>
              {overall}%
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
