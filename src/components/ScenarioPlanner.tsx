import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore, useScores } from '../store';
import DOMAINS from '../data/domains';
import SCENARIOS from '../data/scenarios';
import { useThreatLevel } from '../hooks/useThreatLevel';
import { ThreatEnvironmentPanel, ScenarioThreatBadge, EffectiveRiskDisplay } from './ThreatEnvironment';
import type { Scenario, ThreatData, DomainScores } from '../types';
import {
  ChevronLeft, AlertCircle, CheckCircle2, Info,
  Shield, Activity,
} from 'lucide-react';

interface ScenarioCardProps {
  scenario: Scenario;
  readiness: number;
  onClick: () => void;
  isSelected: boolean;
  threats: ThreatData | null;
  index: number;
}

function ScenarioCard({ scenario, readiness, onClick, isSelected, threats, index }: ScenarioCardProps) {
  const Icon = scenario.icon;
  const threat = threats?.scenarios?.[scenario.id];
  const scoreColor =
    readiness >= 70 ? 'text-emerald-400' :
    readiness >= 40 ? 'text-amber-400' :
                      'text-rose-400';
  const severityMap = {
    critical: { label: 'Critical', cls: 'bg-rose-500/10 text-rose-400 border border-rose-500/15' },
    high: { label: 'High', cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/15' },
    medium: { label: 'Medium', cls: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/15' },
    low: { label: 'Low', cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/15' },
  } as const;
  const severity = severityMap[scenario.severity];

  const effectiveRisk = threat ? Math.round(threat.level * (1 - readiness / 100)) : null;

  return (
    <button
      onClick={onClick}
      className={`
        card-hover p-5 text-left w-full transition-all duration-300
        animate-in stagger-${Math.min(index + 1, 10)}
        hover-glow group
        ${isSelected ? 'ring-2 ring-offset-0 ring-th-border-alt/80 scale-[1.02]' : ''}
      `}
      style={{
        '--card-glow-color': scenario.color,
        ...(isSelected ? { borderColor: scenario.color + '30' } : {}),
      } as React.CSSProperties}
      aria-pressed={isSelected}
      aria-label={`${scenario.name}: ${readiness}% ready`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center
                     transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-3deg]"
          style={{ background: scenario.color + '12' }}
        >
          <Icon className="w-5 h-5" style={{ color: scenario.color }} />
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold score-label ${scoreColor} transition-all duration-500`}>
            {readiness}%
          </span>
          <div className="text-[10px] text-th-faint font-medium">Ready</div>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-th-heading mb-1">{scenario.name}</h3>
      <p className="text-xs text-th-faint mb-2 line-clamp-2 leading-relaxed">{scenario.description}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`badge ${severity.cls}`}>{severity.label} Severity</span>
        <ScenarioThreatBadge scenarioId={scenario.id} threats={threats} />
      </div>
      {effectiveRisk != null && threat && (
        <div className="mt-2.5 pt-2.5 border-t border-th-border/20">
          <EffectiveRiskDisplay readiness={readiness} threatLevel={threat.level} />
        </div>
      )}
    </button>
  );
}

interface AnimatedBarProps {
  score: number;
  color: string;
  weight: number;
  delay: number;
}

function AnimatedBar({ score, color, weight, delay }: AnimatedBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="flex-1 progress-track">
      <div
        ref={barRef}
        className="progress-fill transition-all duration-1000 ease-out"
        style={{
          width: mounted ? `${score}%` : '0%',
          background: `linear-gradient(to right, ${color}cc, ${color})`,
          opacity: 0.4 + (weight * 0.6),
          transitionDelay: `${delay}ms`,
        }}
      />
    </div>
  );
}

interface ScenarioDetailProps {
  scenario: Scenario;
  domainScores: DomainScores;
  checkedIds: Set<string>;
}

function ScenarioDetail({ scenario, domainScores, checkedIds }: ScenarioDetailProps) {
  const Icon = scenario.icon;

  const readiness = useMemo(() => {
    let total = 0;
    for (const [domainId, impact] of Object.entries(scenario.impacts)) {
      if (impact.weight > 0) {
        total += (domainScores[domainId] || 0) * impact.weight;
      }
    }
    return Math.round(total);
  }, [scenario, domainScores]);

  const sortedImpacts = useMemo(() => {
    return Object.entries(scenario.impacts)
      .filter(([, v]) => v.weight > 0)
      .sort((a, b) => b[1].weight - a[1].weight)
      .map(([domainId, impact]) => {
        const domain = DOMAINS.find(d => d.id === domainId);
        return { domainId, domain, impact, score: domainScores[domainId] || 0 };
      });
  }, [scenario, domainScores]);

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
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [scenario, checkedIds]);

  const criticalDone = criticalItems.filter(i => i.completed).length;

  return (
    <div className="space-y-5 animate-slide-in-right">
      {/* Header */}
      <div className="card p-6" style={{ borderColor: scenario.color + '15' }}>
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center
                       shadow-lg transition-transform duration-300 hover:scale-105"
            style={{
              background: scenario.color + '12',
              boxShadow: `0 0 20px -6px ${scenario.color}30`,
            }}
          >
            <Icon className="w-6 h-6" style={{ color: scenario.color }} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-th-heading">{scenario.name}</h2>
            <p className="text-sm text-th-muted leading-relaxed">{scenario.description}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-th-heading score-label">{readiness}%</div>
            <div className="text-xs text-th-faint font-medium">Readiness</div>
          </div>
        </div>

        <div className="space-y-2.5">
          {sortedImpacts.map(({ domain, impact, score }, i) => domain && (
            <div
              key={domain.id}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-th-muted w-20 text-right font-medium">{domain.name}</span>
              <AnimatedBar
                score={score}
                color={domain.color}
                weight={impact.weight}
                delay={i * 80}
              />
              <span className="text-xs text-th-muted w-8 text-right score-label">{score}%</span>
              <span className="text-[10px] text-th-faint w-12 text-right font-medium">
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
          <h3 className="text-sm font-semibold text-th-body uppercase tracking-wide">
            Critical Items for This Scenario
          </h3>
          <span className="ml-auto text-xs text-th-faint font-medium">
            {criticalDone}/{criticalItems.length} ready
          </span>
        </div>
        <div className="space-y-1.5">
          {criticalItems.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all duration-300
                         hover:bg-th-card-alt/20 animate-in stagger-${Math.min(i + 1, 10)}`}
            >
              {item.completed
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 animate-pulse-subtle" />
              }
              <span className={`text-sm flex-1 transition-all duration-200 ${item.completed ? 'text-th-faint line-through' : 'text-th-body'}`}>
                {item.text}
              </span>
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
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
          <h3 className="text-sm font-semibold text-th-body uppercase tracking-wide">Expert Tips</h3>
        </div>
        <div className="space-y-3">
          {scenario.tips.map((tip, i) => (
            <div key={i} className={`flex items-start gap-3 animate-in stagger-${Math.min(i + 1, 10)}`}>
              <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/15
                              flex items-center justify-center flex-shrink-0 mt-0.5
                              transition-transform duration-200 hover:scale-110">
                <span className="text-[10px] font-bold text-blue-400">{i + 1}</span>
              </div>
              <p className="text-sm text-th-body leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface LiveThreatSignalsProps {
  scenarioId: string;
  threats: ThreatData | null;
}

function LiveThreatSignals({ scenarioId, threats }: LiveThreatSignalsProps) {
  const threat = threats?.scenarios?.[scenarioId];
  if (!threat) return null;

  return (
    <div className="card p-5 animate-slide-in-right">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-th-body uppercase tracking-wide">Live Threat Signals</h3>
        <span className={`ml-auto text-sm font-bold score-label transition-all duration-500 ${
          threat.level >= 55 ? 'text-rose-400' :
          threat.level >= 35 ? 'text-amber-400' :
                               'text-emerald-400'
        }`}>
          {threat.level}% {threat.label}
        </span>
      </div>
      <div className="space-y-1.5">
        {threat.signals.map((sig, i) => (
          <div key={i} className="flex items-start gap-2.5 text-xs py-1">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 transition-all duration-300 ${
              sig.includes('high') || sig.includes('INVERTED') || sig.includes('panic') || sig.includes('Extreme')
                ? 'bg-rose-400 shadow-sm shadow-rose-500/30 animate-pulse-subtle'
                : sig.includes('moderate') || sig.includes('rising') || sig.includes('elevated')
                ? 'bg-amber-400 shadow-sm shadow-amber-500/30'
                : 'bg-th-faint'
            }`} />
            <span className="text-th-muted leading-relaxed">{sig}</span>
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const scenarioReadiness = useMemo(() => {
    const map: Record<string, number> = {};
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
    <div className="space-y-6 page-fade">
      <button
        onClick={() => dispatch({ type: 'NAVIGATE', view: 'dashboard' })}
        className="flex items-center gap-1 text-sm text-th-muted hover:text-th-heading
                   transition-all duration-200 hover:-translate-x-0.5 animate-in"
      >
        <ChevronLeft className="w-4 h-4" />
        Dashboard
      </button>

      <div className="animate-in stagger-1">
        <h2 className="text-2xl font-bold text-th-heading mb-1">Scenario Planner</h2>
        <p className="text-sm text-th-muted leading-relaxed">
          How prepared are you for specific crisis scenarios?
          {threats ? ' Live market data is adjusting threat levels in real-time.' : ' Select one to see a detailed breakdown.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            {SCENARIOS.map((s, i) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                readiness={scenarioReadiness[s.id]}
                onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}
                isSelected={s.id === selectedId}
                threats={threats}
                index={i}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <ThreatEnvironmentPanel />

          {selectedId && <LiveThreatSignals scenarioId={selectedId} threats={threats} />}

          {selectedScenario ? (
            <ScenarioDetail
              key={selectedScenario.id}
              scenario={selectedScenario}
              domainScores={domainScores}
              checkedIds={state.checkedIds}
            />
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center text-center min-h-[200px] animate-in">
              <div className="w-14 h-14 rounded-2xl bg-th-card-alt/40 flex items-center justify-center mb-4
                              transition-transform duration-300 hover:scale-105">
                <Info className="w-7 h-7 text-th-faint" />
              </div>
              <h3 className="text-lg font-semibold text-th-muted mb-1">Select a Scenario</h3>
              <p className="text-sm text-th-faint max-w-xs leading-relaxed">
                Click on any scenario card to see how your current preparedness stacks up against that specific threat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
