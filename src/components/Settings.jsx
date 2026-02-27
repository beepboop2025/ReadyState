import { useState, useRef } from 'react';
import { useStore, useScores } from '../store';
import DOMAINS, { getAllItems } from '../data/domains';
import {
  ChevronLeft, Download, Upload, Trash2, User, Users, Sun, Moon,
  AlertTriangle, CheckCircle2,
} from 'lucide-react';

export default function Settings() {
  const { state, dispatch } = useStore();
  const { overall } = useScores();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const fileRef = useRef(null);

  const allItems = getAllItems();
  const completed = allItems.filter(i => state.checkedIds.has(i.id)).length;

  function handleExport() {
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readystate-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version || !Array.isArray(data.checkedIds)) {
          setImportStatus('error');
          return;
        }
        dispatch({ type: 'IMPORT_DATA', data });
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

  return (
    <div className="space-y-6 animate-fade max-w-2xl">
      {/* Back */}
      <button
        onClick={() => dispatch({ type: 'NAVIGATE', view: 'dashboard' })}
        className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Dashboard
      </button>

      <h2 className="text-2xl font-bold text-white">Settings</h2>

      {/* Profile */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
          <User className="w-4 h-4" /> Profile
        </h3>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Your Name (optional)</label>
          <input
            type="text"
            value={state.userName}
            onChange={(e) => dispatch({ type: 'SET_USER_NAME', name: e.target.value })}
            placeholder="e.g. Alex"
            className="w-full bg-surface-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm
                       text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
            <Users className="w-3 h-3" /> Household Size
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={state.householdSize}
            onChange={(e) => dispatch({ type: 'SET_HOUSEHOLD_SIZE', size: e.target.value })}
            className="w-24 bg-surface-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm
                       text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Helps contextualize supply recommendations (water, food quantities).
          </p>
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Appearance</h3>
        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: 'SET_THEME', theme: 'dark' })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${state.theme === 'dark' ? 'bg-slate-800 text-white ring-2 ring-emerald-500/30' : 'text-slate-400 hover:text-white bg-slate-800/40'}`}
          >
            <Moon className="w-4 h-4" /> Dark
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_THEME', theme: 'light' })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${state.theme === 'light' ? 'bg-slate-800 text-white ring-2 ring-emerald-500/30' : 'text-slate-400 hover:text-white bg-slate-800/40'}`}
          >
            <Sun className="w-4 h-4" /> Light (coming soon)
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Your Data</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white score-label">{completed}</div>
            <div className="text-xs text-slate-500">Items Done</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white score-label">{allItems.length}</div>
            <div className="text-xs text-slate-500">Total Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white score-label">{overall}%</div>
            <div className="text-xs text-slate-500">Readiness</div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Data Management</h3>

        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} className="btn-ghost flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Data
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-ghost flex items-center gap-2">
            <Upload className="w-4 h-4" /> Import Data
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>

        {importStatus === 'success' && (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Data imported successfully.
          </div>
        )}
        {importStatus === 'error' && (
          <div className="flex items-center gap-2 text-sm text-rose-400">
            <AlertTriangle className="w-4 h-4" /> Invalid file format.
          </div>
        )}

        <hr className="border-slate-800/60" />

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Reset All Data
          </button>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span className="text-sm text-rose-300 flex-1">This will permanently erase all your progress.</span>
            <button onClick={handleReset} className="px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-500">
              Confirm
            </button>
            <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1.5 text-slate-400 text-xs font-medium hover:text-white">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* About */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">About ReadyState</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          ReadyState is a personal resilience intelligence dashboard that helps you assess, track, and
          improve your preparedness across six critical life domains. All data is stored locally on
          your device — nothing is sent to any server.
        </p>
        <p className="text-xs text-slate-600 mt-3">v1.0.0 — Built with care.</p>
      </div>
    </div>
  );
}
