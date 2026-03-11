import { useState, useRef, useMemo } from 'react';
import { useStore, useScores } from '../store';
import { getAllItems } from '../data/domains';
import { HOUSEHOLD_SIZE_LIMITS, USERNAME_MAX_LENGTH } from '../config';
import type { SerializedState } from '../types';
import {
  ChevronLeft, Download, Upload, Trash2, User, Users, Sun, Moon,
  AlertTriangle, CheckCircle2, FileText,
} from 'lucide-react';

type ImportStatus = 'success' | 'error' | null;

/** Animated pill toggle for theme switching */
function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onToggle}
        className="theme-toggle group"
        data-dark={isDark ? 'true' : 'false'}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        role="switch"
        aria-checked={isDark}
      >
        <div className="theme-toggle-knob flex items-center justify-center">
          {isDark
            ? <Moon className="w-3.5 h-3.5 text-blue-300" />
            : <Sun className="w-3.5 h-3.5 text-amber-500" />
          }
        </div>
      </button>
      <span className="text-sm text-th-body font-medium transition-colors duration-300">
        {isDark ? 'Dark Mode' : 'Light Mode'}
      </span>
    </div>
  );
}

export default function Settings() {
  const { state, dispatch } = useStore();
  const { overall } = useScores();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus>(null);
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const allItems = useMemo(() => getAllItems(), []);
  const completed = allItems.filter(i => state.checkedIds.has(i.id)).length;

  function handleExport(format: 'json' | 'csv' = 'json') {
    const setter = format === 'json' ? setExportingJson : setExportingCsv;
    setter(true);
    setTimeout(() => setter(false), 1200);

    if (format === 'csv') {
      const headers = 'Domain,Category,Item,Weight,Status\n';
      const rows = allItems.map(item => {
        const status = state.checkedIds.has(item.id) ? 'Complete' : 'Incomplete';
        const weight = item.weight === 3 ? 'Critical' : item.weight === 2 ? 'Important' : 'Nice to have';
        return `"${item.domainId}","${item.category}","${item.text.replace(/"/g, '""')}","${weight}","${status}"`;
      }).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      downloadBlob(blob, `readystate-report-${new Date().toISOString().slice(0, 10)}.csv`);
      return;
    }

    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      userName: state.userName,
      householdSize: state.householdSize,
      checkedIds: [...state.checkedIds],
      completionHistory: state.completionHistory,
      theme: state.theme,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `readystate-backup-${new Date().toISOString().slice(0, 10)}.json`);
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data: SerializedState = JSON.parse(ev.target?.result as string);
        if (!data.version || !Array.isArray(data.checkedIds)) {
          setImportStatus('error');
          return;
        }
        const validIds = new Set(allItems.map(i => i.id));
        const filteredIds = data.checkedIds.filter(id => validIds.has(id));
        dispatch({ type: 'IMPORT_DATA', data: { ...data, checkedIds: filteredIds } });
        setImportStatus('success');
        setTimeout(() => setImportStatus(null), 3000);
      } catch {
        setImportStatus('error');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleReset() {
    dispatch({ type: 'RESET' });
    setShowResetConfirm(false);
  }

  function handleHouseholdSize(value: string) {
    const num = Math.min(HOUSEHOLD_SIZE_LIMITS.MAX, Math.max(HOUSEHOLD_SIZE_LIMITS.MIN, Number(value) || 1));
    dispatch({ type: 'SET_HOUSEHOLD_SIZE', size: num });
  }

  function handleUserName(value: string) {
    dispatch({ type: 'SET_USER_NAME', name: value.slice(0, USERNAME_MAX_LENGTH) });
  }

  return (
    <div className="space-y-6 page-fade max-w-2xl">
      {/* Back */}
      <button
        onClick={() => dispatch({ type: 'NAVIGATE', view: 'dashboard' })}
        className="flex items-center gap-1 text-sm text-th-muted hover:text-th-heading
                   transition-all duration-200 hover:-translate-x-0.5 animate-in"
      >
        <ChevronLeft className="w-4 h-4" />
        Dashboard
      </button>

      <h2 className="text-2xl font-bold text-th-heading animate-in stagger-1">Settings</h2>

      {/* Profile */}
      <div className="card p-6 space-y-5 animate-in stagger-2">
        <h3 className="text-sm font-semibold text-th-body uppercase tracking-wide flex items-center gap-2">
          <User className="w-4 h-4" /> Profile
        </h3>

        <div>
          <label className="block text-xs text-th-muted mb-2 font-medium" htmlFor="settings-name">
            Your Name (optional)
          </label>
          <input
            id="settings-name"
            type="text"
            value={state.userName}
            onChange={(e) => handleUserName(e.target.value)}
            placeholder="e.g. Alex"
            maxLength={USERNAME_MAX_LENGTH}
            className="w-full bg-th-input/50 backdrop-blur-sm border border-th-border/50 rounded-xl
                       px-4 py-2.5 text-sm text-th-heading placeholder-th-faint
                       focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/40
                       transition-all duration-200
                       hover:border-th-border-alt/60"
          />
        </div>

        <div>
          <label className="block text-xs text-th-muted mb-2 flex items-center gap-1 font-medium" htmlFor="settings-household">
            <Users className="w-3 h-3" /> Household Size
          </label>
          <input
            id="settings-household"
            type="number"
            min={HOUSEHOLD_SIZE_LIMITS.MIN}
            max={HOUSEHOLD_SIZE_LIMITS.MAX}
            value={state.householdSize}
            onChange={(e) => handleHouseholdSize(e.target.value)}
            className="w-24 bg-th-input/50 backdrop-blur-sm border border-th-border/50 rounded-xl
                       px-4 py-2.5 text-sm text-th-heading
                       focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/40
                       transition-all duration-200
                       hover:border-th-border-alt/60"
          />
          <p className="text-xs text-th-faint mt-2 leading-relaxed">
            Helps contextualize supply recommendations (water: {state.householdSize * 3} gal for 3 days).
          </p>
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-6 space-y-4 animate-in stagger-3">
        <h3 className="text-sm font-semibold text-th-body uppercase tracking-wide">Appearance</h3>
        <ThemeToggle
          isDark={state.theme === 'dark'}
          onToggle={() => dispatch({ type: 'SET_THEME', theme: state.theme === 'dark' ? 'light' : 'dark' })}
        />
      </div>

      {/* Stats */}
      <div className="card p-6 animate-in stagger-4">
        <h3 className="text-sm font-semibold text-th-body uppercase tracking-wide mb-5">Your Data</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-xl bg-th-card-alt/20 border border-th-border/15
                          transition-all duration-300 hover:bg-th-card-alt/30 hover:border-th-border-alt/20
                          hover:shadow-sm group">
            <div className="text-2xl font-bold text-th-heading score-label transition-transform duration-200 group-hover:scale-105">
              {completed}
            </div>
            <div className="text-xs text-th-faint font-medium mt-0.5">Items Done</div>
          </div>
          <div className="p-3 rounded-xl bg-th-card-alt/20 border border-th-border/15
                          transition-all duration-300 hover:bg-th-card-alt/30 hover:border-th-border-alt/20
                          hover:shadow-sm group">
            <div className="text-2xl font-bold text-th-heading score-label transition-transform duration-200 group-hover:scale-105">
              {allItems.length}
            </div>
            <div className="text-xs text-th-faint font-medium mt-0.5">Total Items</div>
          </div>
          <div className="p-3 rounded-xl bg-th-card-alt/20 border border-th-border/15
                          transition-all duration-300 hover:bg-th-card-alt/30 hover:border-th-border-alt/20
                          hover:shadow-sm group">
            <div className="text-2xl font-bold text-th-heading score-label transition-transform duration-200 group-hover:scale-105">
              {overall}%
            </div>
            <div className="text-xs text-th-faint font-medium mt-0.5">Readiness</div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card p-6 space-y-5 animate-in stagger-5">
        <h3 className="text-sm font-semibold text-th-body uppercase tracking-wide">Data Management</h3>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport('json')}
            className={`btn-ghost flex items-center gap-2 border border-th-border/30
                       transition-all duration-300
                       ${exportingJson ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5 shadow-sm shadow-emerald-500/10' : ''}`}
          >
            {exportingJson
              ? <CheckCircle2 className="w-4 h-4 animate-check-bounce" />
              : <Download className="w-4 h-4" />
            }
            {exportingJson ? 'Exported!' : 'Export JSON'}
          </button>
          <button
            onClick={() => handleExport('csv')}
            className={`btn-ghost flex items-center gap-2 border border-th-border/30
                       transition-all duration-300
                       ${exportingCsv ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5 shadow-sm shadow-emerald-500/10' : ''}`}
          >
            {exportingCsv
              ? <CheckCircle2 className="w-4 h-4 animate-check-bounce" />
              : <FileText className="w-4 h-4" />
            }
            {exportingCsv ? 'Exported!' : 'Export CSV'}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-ghost flex items-center gap-2 border border-th-border/30
                       hover:border-blue-500/20"
          >
            <Upload className="w-4 h-4" /> Import Data
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>

        {importStatus === 'success' && (
          <div className="flex items-center gap-2 text-sm text-emerald-400 animate-slide-in-right
                          bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3" role="alert">
            <CheckCircle2 className="w-4 h-4" /> Data imported successfully.
          </div>
        )}
        {importStatus === 'error' && (
          <div className="flex items-center gap-2 text-sm text-rose-400 animate-slide-in-right
                          bg-rose-500/5 border border-rose-500/15 rounded-xl px-4 py-3" role="alert">
            <AlertTriangle className="w-4 h-4" /> Invalid file format. Expected a ReadyState JSON backup.
          </div>
        )}

        <hr className="border-th-border/30" />

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300
                       transition-all duration-200 hover:translate-x-0.5 group"
          >
            <Trash2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" /> Reset All Data
          </button>
        ) : (
          <div
            className="flex items-center gap-3 p-4 bg-rose-500/8 border border-rose-500/15 rounded-xl
                       animate-slide-in-right"
            role="alert"
          >
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 animate-pulse-subtle" />
            <span className="text-sm text-rose-300 flex-1">This will permanently erase all your progress.</span>
            <button
              onClick={handleReset}
              className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg
                         hover:bg-rose-500 transition-all duration-200
                         shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30
                         active:scale-[0.97]"
            >
              Confirm
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1.5 text-th-muted text-xs font-medium hover:text-th-heading
                         transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* About */}
      <div className="card p-6 animate-in stagger-6">
        <h3 className="text-sm font-semibold text-th-body uppercase tracking-wide mb-3">About ReadyState</h3>
        <p className="text-sm text-th-muted leading-relaxed">
          ReadyState is a personal resilience intelligence dashboard that helps you assess, track, and
          improve your preparedness across six critical life domains. All data is stored locally on
          your device — nothing is sent to any server.
        </p>
        <p className="text-xs text-th-faint mt-3 font-medium">v2.0.0 — Now with TypeScript.</p>
      </div>
    </div>
  );
}
