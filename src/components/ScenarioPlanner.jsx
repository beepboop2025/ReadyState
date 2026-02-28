import { useState, useMemo } from 'react';
import { useStore, useScores } from '../store';
import DOMAINS from '../data/domains';
import SCENARIOS from '../data/scenarios';
import { useThreatLevel } from '../hooks/useThreatLevel';
import { ThreatEnvironmentPanel, ScenarioThreatBadge, EffectiveRiskDisplay } from './ThreatEnvironment';
import {
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Info,
  ArrowRight, Shield, Activity,
} from 'lucide-react';

function ScenarioCard({ scenario, readiness, onClick, isSelected, threats }) {
  const Icon = scenario.icon;
  const threat = threats?.scenarios?.[scenario.id];
  const scoreColor =
    readiness >= 70 ? 'text-emerald-400' :
    readiness >= 40 ? 'text-amber-400' :
                      'text-rose-400';
  const severityMap = {
    critical: { label: 'Critical', cls: 'bg-rose-500/15 text-rose-400' },
    high: { label: 'High', cls: 'bg-amber-500/15 text-amber-400' },
    medium: { label: 'Medium', cls: 'bg-yellow-500/15 text-yellow-400' },
    low: { label: 'Low', cls: 'bg-blue-500/15 text-blue-400' },
  };
  const severity = severityMap[scenario.severity] || severityMap.medium;

  // Effective risk = threat × (1 - readiness/100)
  const effectiveRisk = threat ? Math.round(threat.level * (1 - readiness / 100)) : null;

  return (
    <button
      onClick={onClick}
      className={`
        card-hover p-5 text-left w-full transition-all duration-200
        ${isSelected ? 'ring-2 ring-offset-0 ring-slate-500' : ''}
      `}
      style={isSelected ? { borderColor: scenario.color + '40' } : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: scenario.color + '15' }}>
          <Icon className="w-5 h-5" style={{ color: scenario.color }} />
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold score-label ${scoreColor}`}>{readiness}%</span>
          <div className="text-[10px] text-slate-500">Ready</div>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{scenario.name}</h3>
      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{scenario.description}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`badge ${severity.cls}`}>{severity.label} Severity</span>
        <ScenarioThreatBadge scenarioId={scenario.id} threats={threats} />
      </div>
      {effectiveRisk != null && (
        <div className="mt-2 pt-2 border-t border-slate-800/30">
          <EffectiveRiskDisplay readiness={readiness} threatLevel={threat.level} />
        </div>
      )}
    </button>
  );
}

function ScenarioDetail({ scenario, domainScores, checkedIds }) {
  const Icon = scenario.icon;

  // Calculate weighted readiness
  const readiness = useMemo(() => {
    let total = 0;
    for (const [domainId, impact] of Object.entries(scenario.impacts)) {
      if (impact.weight > 0) {
        total += (domainScores[domainId] || 0) * impact.weight;
      }
    }
    return Math.round(total);
  }, [scenario, domainScores]);

  // Sort impacts by weight descending
  const sortedImpacts = useMemo(() => {
    return Object.entries(scenario.impacts)
      .filter(([, v]) => v.weight > 0)
      .sort((a, b) => b[1].weight - a[1].weight)
      .map(([domainId, impact]) => {
        const domain = DOMAINS.find(d => d.id === domainId);
        return { domainId, domain, impact, score: domainScores[domainId] || 0 };
      });
  }, [scenario, domainScores]);

  // Critical items status
  const criticalItems = useMemo(() => {
    return scenario.criticalItems.map(itemId => {
      for (const domain of DOMAINS) {
        for (const cat of domain.categories) {
          const item = cat.items.find(i => i.id === itemId);
          if (item) {
            return {
              ...item,
              domainId: domain.id,
              domainName: domain.name,
              domainColor: domain.color,
              completed: checkedIds.has(item.id),
            };
          }
        }
      }
      return null;
    }).filter(Boolean);
  }, [scenario, checkedIds]);

  const criticalDone = criticalItems.filter(i => i.completed).length;

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="card p-6" style={{ borderColor: scenario.color + '20' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: scenario.color + '15' }}>
            <Icon className="w-6 h-6" style={{ color: scenario.color }} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{scenario.name}</h2>
            <p className="text-sm text-slate-400">{scenario.description}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-white score-label">{readiness}%</div>
            <div className="text-xs text-slate-500">Readiness</div>
          </div>
        </div>

        {/* Impact breakdown */}
        <div className="space-y-2">
          {sortedImpacts.map(({ domain, impact, score }) => (
            <div key={domain.id} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-20 text-right">{domain.name}</span>
              <div className="flex-1 progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${score}%`,
                    background: domain.color,
                    opacity: 0.3 + (impact.weight * 0.7),
                  }}
                />
              </div>
              <span className="text-xs text-slate-400 w-8 text-right score-label">{score}%</span>
              <span className="text-[10px] text-slate-600 w-12 text-right">
                {Math.round(impact.weight * 100)}% wt
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Items */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Critical Items for This Scenario
          </h3>
          <span className="ml-auto text-xs text-slate-500">
            {criticalDone}/{criticalItems.length} ready
          </span>
        </div>
        <div className="space-y-2">
          {criticalItems.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-2">
              {item.completed
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              }
              <span className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                {item.text}
              </span>
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 ml-auto"
                style={{ background: item.domainColor }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Expert Tips</h3>
        </div>
        <div className="space-y-3">
          {scenario.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-blue-400">{i + 1}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveThreatSignals({ scenarioId, threats }) {
  const threat = threats?.scenarios?.[scenarioId];
  if (!threat) return null;

  return (
    <div className="card p-5 animate-in">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Live Threat Signals</h3>
        <span className={`ml-auto text-sm font-bold score-label ${
          threat.level >= 55 ? 'text-rose-400' :
          threat.level >= 35 ? 'text-amber-400' :
                               'text-emerald-400'
        }`}>
          {threat.level}% {threat.label}
        </span>
      </div>
      <div className="space-y-1.5">
        {threat.signals.map((sig, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
              sig.includes('high') || sig.includes('INVERTED') || sig.includes('panic') || sig.includes('Extreme')
                ? 'bg-rose-400'
                : sig.includes('moderate') || sig.includes('rising') || sig.includes('elevated')
                ? 'bg-amber-400'
                : 'bg-slate-500'
            }`} />
            <span className="text-slate-400">{sig}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScenarioPlanner() {
  const { state, dispatch } = useStore();
  const { domainScores } = useScores();
  const { threats } = useThreatLevel();
  const [selectedId, setSelectedId] = useState(null);

  const scenarioReadiness = useMemo(() => {
    const map = {};
    for (const s of SCENARIOS) {
      let total = 0;
      for (const [domainId, impact] of Object.entries(s.impacts)) {
        if (impact.weight > 0) {
          total += (domainScores[domainId] || 0) * impact.weight;
        }
      }
      map[s.id] = Math.round(total);
    }
    return map;
  }, [domainScores]);

  const selectedScenario = SCENARIOS.find(s => s.id === selectedId);

  return (
    <div className="space-y-6 animate-fade">
      {/* Back */}
      <button
        onClick={() => dispatch({ type: 'NAVIGATE', view: 'dashboard' })}
        className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Dashboard
      </button>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Scenario Planner</h2>
        <p className="text-sm text-slate-400">
          How prepared are you for specific crisis scenarios?
          {threats ? ' Live market data is adjusting threat levels in real-time.' : ' Select one to see a detailed breakdown.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Scenario Grid — wider */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            {SCENARIOS.map(s => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                readiness={scenarioReadiness[s.id]}
                onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}
                isSelected={s.id === selectedId}
                threats={threats}
              />
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Market Intelligence Panel */}
          <ThreatEnvironmentPanel />

          {/* Live signals for selected scenario */}
          {selectedId && <LiveThreatSignals scenarioId={selectedId} threats={threats} />}

          {selectedScenario ? (
            <ScenarioDetail
              scenario={selectedScenario}
              domainScores={domainScores}
              checkedIds={state.checkedIds}
            />
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center text-center min-h-[200px]">
              <Info className="w-10 h-10 text-slate-700 mb-3" />
              <h3 className="text-lg font-semibold text-slate-400 mb-1">Select a Scenario</h3>
              <p className="text-sm text-slate-500 max-w-xs">
                Click on any scenario card to see how your current preparedness stacks up against that specific threat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
