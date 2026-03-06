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

export default function Settings() {
  const { state, dispatch } = useStore();
  const { overall } = useScores();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const allItems = useMemo(() => getAllItems(), []);
  const completed = allItems.filter(i => state.checkedIds.has(i.id)).length;

  function handleExport(format: 'json' | 'csv' = 'json') {
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
        // Validate that checkedIds are real item IDs
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
    <div className="space-y-6 animate-fade max-w-2xl">
      {/* Back */}
      <button
        onClick={() => dispatch({ type: 'NAVIGATE', view: 'dashboard' })}
        className="flex items-center gap-1 text-sm text-th-muted hover:text-th-heading transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Dashboard
      </button>

      <h2 className="text-2xl font-bold text-th-heading">Settings</h2>

      {/* Profile */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-th-body uppercase tracking-wide flex items-center gap-2">
          <User className="w-4 h-4" /> Profile
        </h3>

        <div>
          <label className="block text-xs text-th-muted mb-1.5" htmlFor="settings-name">Your Name (optional)</label>
          <input
            id="settings-name"
            type="text"
            value={state.userName}
            onChange={(e) => handleUserName(e.target.value)}
            placeholder="e.g. Alex"
            maxLength={USERNAME_MAX_LENGTH}
            className="w-full bg-th-input border border-th-border-alt rounded-xl px-4 py-2.5 text-sm
                       text-th-heading placeholder-th-faint focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50"
          />
        </div>

        <div>
          <label className="block text-xs text-th-muted mb-1.5 flex items-center gap-1" htmlFor="settings-household">
            <Users className="w-3 h-3" /> Household Size
          </label>
          <input
            id="settings-household"
            type="number"
            min={HOUSEHOLD_SIZE_LIMITS.MIN}
            max={HOUSEHOLD_SIZE_LIMITS.MAX}
            value={state.householdSize}
            onChange={(e) => handleHouseholdSize(e.target.value)}
            className="w-24 bg-th-input border border-th-border-alt rounded-xl px-4 py-2.5 text-sm
                       text-th-heading focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50"
          />
          <p className="text-xs text-th-faint mt-1.5">
            Helps contextualize supply recommendations (water: {state.householdSize * 3} gal for 3 days).
          </p>
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-th-body uppercase tracking-wide">Appearance</h3>
        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: 'SET_THEME', theme: 'dark' })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${state.theme === 'dark' ? 'bg-th-input text-th-heading ring-2 ring-emerald-500/30' : 'text-th-muted hover:text-th-heading bg-th-card-alt/40'}`}
          >
            <Moon className="w-4 h-4" /> Dark
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_THEME', theme: 'light' })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${state.theme === 'light' ? 'bg-th-input text-th-heading ring-2 ring-emerald-500/30' : 'text-th-muted hover:text-th-heading bg-th-card-alt/40'}`}
          >
            <Sun className="w-4 h-4" /> Light
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-th-body uppercase tracking-wide mb-4">Your Data</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-th-heading score-label">{completed}</div>
            <div className="text-xs text-th-faint">Items Done</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-th-heading score-label">{allItems.length}</div>
            <div className="text-xs text-th-faint">Total Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-th-heading score-label">{overall}%</div>
            <div className="text-xs text-th-faint">Readiness</div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-th-body uppercase tracking-wide">Data Management</h3>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => handleExport('json')} className="btn-ghost flex items-center gap-2">
            <Download className="w-4 h-4" /> Export JSON
          </button>
          <button onClick={() => handleExport('csv')} className="btn-ghost flex items-center gap-2">
            <FileText className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-ghost flex items-center gap-2">
            <Upload className="w-4 h-4" /> Import Data
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>

        {importStatus === 'success' && (
          <div className="flex items-center gap-2 text-sm text-emerald-400" role="alert">
            <CheckCircle2 className="w-4 h-4" /> Data imported successfully.
          </div>
        )}
        {importStatus === 'error' && (
          <div className="flex items-center gap-2 text-sm text-rose-400" role="alert">
            <AlertTriangle className="w-4 h-4" /> Invalid file format. Expected a ReadyState JSON backup.
          </div>
        )}

        <hr className="border-th-border/60" />

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Reset All Data
          </button>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl" role="alert">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span className="text-sm text-rose-300 flex-1">This will permanently erase all your progress.</span>
            <button onClick={handleReset} className="px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-500">
              Confirm
            </button>
            <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1.5 text-th-muted text-xs font-medium hover:text-th-heading">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* About */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-th-body uppercase tracking-wide mb-2">About ReadyState</h3>
        <p className="text-sm text-th-muted leading-relaxed">
          ReadyState is a personal resilience intelligence dashboard that helps you assess, track, and
          improve your preparedness across six critical life domains. All data is stored locally on
          your device — nothing is sent to any server.
        </p>
        <p className="text-xs text-th-faint mt-3">v2.0.0 — Now with TypeScript.</p>
      </div>
    </div>
  );
}
