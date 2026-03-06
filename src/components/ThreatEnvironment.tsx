import { useThreatLevel } from '../hooks/useThreatLevel';
import { THREAT_THRESHOLDS } from '../config';
import type { ThreatData, ImpactLevel } from '../types';
import {
  Activity, Wifi, WifiOff, RefreshCw, AlertTriangle,
  Shield, ChevronRight, Radio,
} from 'lucide-react';

interface ThreatMeterProps {
  level: number;
  label: string;
  size?: 'md' | 'lg';
}

function ThreatMeter({ level, label, size = 'md' }: ThreatMeterProps) {
  const color =
    level >= THREAT_THRESHOLDS.CRITICAL ? 'from-rose-600 to-rose-400' :
    level >= THREAT_THRESHOLDS.ELEVATED ? 'from-amber-600 to-amber-400' :
    level >= THREAT_THRESHOLDS.MODERATE ? 'from-yellow-600 to-yellow-400' :
                  'from-emerald-600 to-emerald-400';
  const textColor =
    level >= THREAT_THRESHOLDS.CRITICAL ? 'text-rose-400' :
    level >= THREAT_THRESHOLDS.ELEVATED ? 'text-amber-400' :
    level >= THREAT_THRESHOLDS.MODERATE ? 'text-yellow-400' :
                  'text-emerald-400';
  const glow =
    level >= THREAT_THRESHOLDS.CRITICAL ? 'shadow-rose-500/20' :
    level >= THREAT_THRESHOLDS.ELEVATED ? 'shadow-amber-500/20' :
    level >= THREAT_THRESHOLDS.MODERATE ? 'shadow-yellow-500/20' :
                  'shadow-emerald-500/20';

  const isLg = size === 'lg';

  return (
    <div
      className={`flex items-center gap-3 ${isLg ? 'gap-4' : ''}`}
      role="meter"
      aria-valuenow={level}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Threat level: ${level}% ${label}`}
    >
      <div className={`relative ${isLg ? 'w-48' : 'w-32'} h-2.5 rounded-full bg-th-input shadow-inner overflow-hidden`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out shadow-lg ${glow}`}
          style={{ width: `${level}%` }}
        />
      </div>
      <span className={`font-bold score-label ${textColor} ${isLg ? 'text-lg' : 'text-sm'}`}>
        {level}%
      </span>
      <span className={`text-xs uppercase tracking-wide font-semibold ${textColor}`}>
        {label}
      </span>
    </div>
  );
}

interface SignalPillProps {
  text: string;
  impact: ImpactLevel;
}

function SignalPill({ text, impact }: SignalPillProps) {
  const cls =
    impact === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
    impact === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-th-faint/10 text-th-muted border-th-border/20';
  return (
    <div className={`text-xs px-3 py-1.5 rounded-lg border ${cls}`}>
      {text}
    </div>
  );
}

interface ThreatEnvironmentCardProps {
  onNavigate: () => void;
}

export function ThreatEnvironmentCard({ onNavigate }: ThreatEnvironmentCardProps) {
  const { threats, connected, loading, lastUpdate, refresh } = useThreatLevel();

  if (loading) {
    return (
      <div className="card p-5 animate-in">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
          <span className="text-sm font-semibold text-th-body uppercase tracking-wide">Threat Environment</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-th-faint">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Connecting to DragonScope...
        </div>
      </div>
    );
  }

  if (!connected || !threats) {
    return (
      <div className="card p-5 animate-in border-th-border/40">
        <div className="flex items-center gap-2 mb-3">
          <WifiOff className="w-4 h-4 text-th-faint" />
          <span className="text-sm font-semibold text-th-body uppercase tracking-wide">Threat Environment</span>
        </div>
        <p className="text-xs text-th-faint mb-3">
          DragonScope is offline. Threat levels are using static defaults.
        </p>
        <button onClick={refresh} className="btn-ghost text-xs flex items-center gap-1.5" aria-label="Retry DragonScope connection">
          <RefreshCw className="w-3 h-3" /> Retry Connection
        </button>
      </div>
    );
  }

  const { overall } = threats;

  return (
    <div className="card p-5 animate-in" aria-live="polite">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse-subtle" />
          </div>
          <span className="text-sm font-semibold text-th-body uppercase tracking-wide">Threat Environment</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-th-faint">
          <Wifi className="w-3 h-3 text-emerald-500" />
          LIVE
        </div>
      </div>

      <ThreatMeter level={overall.level} label={overall.label} />

      <div className="mt-3 space-y-1.5">
        {overall.factors.slice(0, 3).map((f, i) => (
          <SignalPill key={i} text={f.text} impact={f.impact} />
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-th-border/40">
        <span className="text-[10px] text-th-faint">
          Updated {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '—'}
        </span>
        <button
          onClick={onNavigate}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Scenarios <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export function ThreatEnvironmentPanel() {
  const { threats, connected, refresh } = useThreatLevel();

  if (!connected || !threats) {
    return (
      <div className="card p-6 text-center animate-in">
        <WifiOff className="w-8 h-8 text-th-faint mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-th-muted mb-1">DragonScope Offline</h3>
        <p className="text-xs text-th-faint mb-3">
          Start DragonScope's data server to see live market-driven threat levels.
        </p>
        <code className="text-[11px] text-th-faint bg-th-card-alt/60 px-3 py-1.5 rounded-lg block mb-3">
          cd ~/Documents/DragonScope && node server/dataServer.js
        </code>
        <button onClick={refresh} className="btn-ghost text-xs flex items-center gap-1.5 mx-auto" aria-label="Retry DragonScope connection">
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  const { overall, rawSignals } = threats;

  return (
    <div className="card p-5 animate-in" aria-live="polite">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <Activity className="w-4 h-4 text-blue-400" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse-subtle" />
        </div>
        <h3 className="text-sm font-semibold text-th-body uppercase tracking-wide">
          Market Intelligence
        </h3>
        <span className="ml-auto badge bg-emerald-500/10 text-emerald-400">
          <Wifi className="w-3 h-3 mr-1" /> Connected
        </span>
      </div>

      <div className="mb-4">
        <div className="text-xs text-th-faint mb-1.5 uppercase tracking-wide">Overall Threat Environment</div>
        <ThreatMeter level={overall.level} label={overall.label} size="lg" />
      </div>

      <div className="space-y-1.5 mb-4">
        {overall.factors.map((f, i) => (
          <SignalPill key={i} text={f.text} impact={f.impact} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-th-border/40">
        {rawSignals.fearGreed && (
          <div className="text-center p-2 rounded-lg bg-th-card-alt/30">
            <div className="text-lg font-bold text-th-heading score-label">{rawSignals.fearGreed.value}</div>
            <div className="text-[10px] text-th-faint">Fear & Greed</div>
          </div>
        )}
        {rawSignals.bonds && (
          <div className="text-center p-2 rounded-lg bg-th-card-alt/30">
            <div className={`text-lg font-bold score-label ${rawSignals.bonds.inverted ? 'text-rose-400' : 'text-th-body'}`}>
              {rawSignals.bonds.spread2s10s?.toFixed(2) || '—'}%
            </div>
            <div className="text-[10px] text-th-faint">2s10s Spread</div>
          </div>
        )}
        {rawSignals.economic?.unemployment != null && (
          <div className="text-center p-2 rounded-lg bg-th-card-alt/30">
            <div className="text-lg font-bold text-th-heading score-label">{rawSignals.economic.unemployment}%</div>
            <div className="text-[10px] text-th-faint">Unemployment</div>
          </div>
        )}
        {rawSignals.sentiment && (
          <div className="text-center p-2 rounded-lg bg-th-card-alt/30">
            <div className={`text-lg font-bold score-label ${rawSignals.sentiment.bearish > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {rawSignals.sentiment.bearish > 50 ? 'Bearish' : 'Neutral'}
            </div>
            <div className="text-[10px] text-th-faint">Reddit Mood</div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ScenarioThreatBadgeProps {
  scenarioId: string;
  threats: ThreatData | null;
}

export function ScenarioThreatBadge({ scenarioId, threats }: ScenarioThreatBadgeProps) {
  if (!threats?.scenarios?.[scenarioId]) return null;

  const { level, label } = threats.scenarios[scenarioId];
  const color =
    level >= THREAT_THRESHOLDS.CRITICAL ? 'bg-rose-500/15 text-rose-400' :
    level >= THREAT_THRESHOLDS.ELEVATED ? 'bg-amber-500/15 text-amber-400' :
    level >= THREAT_THRESHOLDS.MODERATE ? 'bg-yellow-500/15 text-yellow-400' :
                  'bg-emerald-500/15 text-emerald-400';

  return (
    <span className={`badge ${color}`}>
      <AlertTriangle className="w-3 h-3 mr-1" />
      {label} Threat
    </span>
  );
}

interface EffectiveRiskDisplayProps {
  readiness: number;
  threatLevel: number;
}

export function EffectiveRiskDisplay({ readiness, threatLevel }: EffectiveRiskDisplayProps) {
  const risk = Math.round(threatLevel * (1 - readiness / 100));
  const color =
    risk >= 60 ? 'text-rose-400' :
    risk >= 40 ? 'text-amber-400' :
    risk >= 20 ? 'text-yellow-400' :
                 'text-emerald-400';

  return (
    <div className="flex items-center gap-2">
      <Shield className="w-3.5 h-3.5 text-th-faint" />
      <span className="text-xs text-th-muted">Effective Risk:</span>
      <span className={`text-sm font-bold score-label ${color}`}>{risk}%</span>
    </div>
  );
}
