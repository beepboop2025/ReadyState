import { useMemo } from 'react';
import { useStore, useScores } from '../store';
import DOMAINS, { getAllItems } from '../data/domains';
import ReadinessGauge from './ReadinessGauge';
import DomainRadarChart from './RadarChart';
import ActionItems from './ActionItems';
import { ThreatEnvironmentCard } from './ThreatEnvironment';
import {
  TrendingUp, ArrowRight, CheckCircle, Clock,
  BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

function DomainCard({ domain, score, onClick }) {
  const Icon = domain.icon;
  const totalItems = domain.categories.reduce((acc, c) => acc + c.items.length, 0);

  const barColor =
    score >= 80 ? 'bg-emerald-500' :
    score >= 60 ? 'bg-yellow-500' :
    score >= 40 ? 'bg-amber-500' :
                  'bg-rose-500';

  return (
    <button
      onClick={onClick}
      className="card-hover p-5 text-left group animate-in"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: domain.colorBg }}
        >
          <Icon className="w-5 h-5" style={{ color: domain.color }} />
        </div>
        <span className="text-2xl font-bold text-white score-label">{score}%</span>
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{domain.name}</h3>
      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{domain.description}</p>
      <div className="progress-track">
        <div className={`progress-fill ${barColor}`} style={{ width: `${score}%` }} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-slate-600">{totalItems} items</span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </button>
  );
}

function StatsRow({ checkedIds }) {
  const allItems = useMemo(() => getAllItems(), []);
  const completed = allItems.filter(i => checkedIds.has(i.id)).length;
  const total = allItems.length;
  const criticalDone = allItems.filter(i => i.weight === 3 && checkedIds.has(i.id)).length;
  const criticalTotal = allItems.filter(i => i.weight === 3).length;

  const stats = [
    {
      label: 'Items Completed',
      value: `${completed}/${total}`,
      icon: CheckCircle,
      color: 'text-emerald-400',
    },
    {
      label: 'Critical Items',
      value: `${criticalDone}/${criticalTotal}`,
      icon: Clock,
      color: 'text-rose-400',
    },
    {
      label: 'Domains',
      value: DOMAINS.length.toString(),
      icon: BarChart3,
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(s => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="card p-4 animate-in">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">{s.label}</span>
            </div>
            <span className="text-xl font-bold text-white score-label">{s.value}</span>
          </div>
        );
      })}
    </div>
  );
}

function TrendChart({ history }) {
  if (history.length < 2) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center h-48 animate-in">
        <TrendingUp className="w-8 h-8 text-slate-700 mb-2" />
        <p className="text-sm text-slate-500 text-center">
          Your readiness trend will appear here as you make progress over multiple days.
        </p>
      </div>
    );
  }

  const data = history.map(h => ({
    date: h.date.slice(5), // MM-DD
    score: h.score,
  }));

  return (
    <div className="card p-5 animate-in">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Readiness Trend</h3>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} hide />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid rgba(51,65,85,0.6)',
              borderRadius: 12,
              color: '#e2e8f0',
              fontSize: 12,
            }}
            formatter={(val) => [`${val}%`, 'Readiness']}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#trendGrad)"
            dot={{ r: 3, fill: '#10b981' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  const { state, dispatch } = useStore();
  const { domainScores, overall } = useScores();

  return (
    <div className="space-y-8 animate-fade">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Gauge */}
        <div className="flex-shrink-0">
          <ReadinessGauge score={overall} size={220} />
        </div>

        {/* Right side */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {overall >= 80 ? 'You\'re well prepared.' :
               overall >= 60 ? 'Good progress — keep going.' :
               overall >= 40 ? 'Getting there. Focus on critical items.' :
               overall >= 20 ? 'Let\'s build your resilience.' :
                               'Start your resilience journey today.'}
            </h2>
            <p className="text-sm text-slate-400">
              Your personal resilience score across {DOMAINS.length} critical life domains.
              Every item you complete makes you more prepared for the unexpected.
            </p>
          </div>
          <StatsRow checkedIds={state.checkedIds} />
        </div>
      </div>

      {/* Domain Grid + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">Domains</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DOMAINS.map((d, i) => (
              <DomainCard
                key={d.id}
                domain={d}
                score={domainScores[d.id]}
                onClick={() => dispatch({ type: 'NAVIGATE', view: `domain:${d.id}` })}
              />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <ThreatEnvironmentCard
            onNavigate={() => dispatch({ type: 'NAVIGATE', view: 'scenarios' })}
          />
          <div className="card p-5 animate-in">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Domain Balance</h3>
            <DomainRadarChart />
          </div>
          <TrendChart history={state.completionHistory} />
        </div>
      </div>

      {/* Action Items */}
      <div>
        <ActionItems limit={8} />
      </div>
    </div>
  );
}
