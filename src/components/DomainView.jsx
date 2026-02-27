import { useMemo, useState } from 'react';
import { useStore, useScores } from '../store';
import DOMAINS, { calcDomainScore } from '../data/domains';
import ReadinessGauge from './ReadinessGauge';
import {
  ChevronLeft, ChevronDown, ChevronUp, Lightbulb, Filter,
} from 'lucide-react';

function WeightDot({ weight }) {
  if (weight === 3) return <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" title="Critical" />;
  if (weight === 2) return <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Important" />;
  return <span className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" title="Nice to have" />;
}

function CategorySection({ category, domain, checkedIds, onToggle, filter }) {
  const [collapsed, setCollapsed] = useState(false);

  const items = filter === 'all'
    ? category.items
    : filter === 'todo'
    ? category.items.filter(i => !checkedIds.has(i.id))
    : category.items.filter(i => checkedIds.has(i.id));

  const completed = category.items.filter(i => checkedIds.has(i.id)).length;
  const total = category.items.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  if (items.length === 0) return null;

  return (
    <div className="card overflow-hidden animate-in">
      {/* Category Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-800/30 transition-colors"
      >
        <div
          className="w-1.5 h-8 rounded-full flex-shrink-0"
          style={{ background: domain.color }}
        />
        <div className="flex-1 text-left">
          <h3 className="text-sm font-semibold text-white">{category.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{completed} of {total} completed</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 progress-track hidden sm:block">
            <div
              className="progress-fill"
              style={{ width: `${pct}%`, background: domain.color }}
            />
          </div>
          <span className="text-sm font-semibold score-label" style={{ color: domain.color }}>
            {pct}%
          </span>
          {collapsed ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {/* Items */}
      {!collapsed && (
        <div className="border-t border-slate-800/40">
          {items.map((item) => {
            const checked = checkedIds.has(item.id);
            return (
              <label
                key={item.id}
                className={`
                  check-item flex items-start gap-3 px-5 py-3.5 cursor-pointer
                  border-b border-slate-800/20 last:border-b-0
                  hover:bg-slate-800/20 transition-colors
                  ${checked ? 'opacity-60' : ''}
                `}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <WeightDot weight={item.weight} />
                    <span className={`text-sm ${checked ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {item.text}
                    </span>
                  </div>
                  {item.tips && !checked && (
                    <div className="flex items-start gap-1.5 mt-2 ml-4">
                      <Lightbulb className="w-3 h-3 text-amber-500/70 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-slate-500 leading-relaxed">{item.tips}</span>
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DomainView({ domainId }) {
  const { state, dispatch } = useStore();
  const domain = DOMAINS.find(d => d.id === domainId);
  const [filter, setFilter] = useState('all');

  if (!domain) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Domain not found.</p>
        <button
          className="btn-ghost mt-4"
          onClick={() => dispatch({ type: 'NAVIGATE', view: 'dashboard' })}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const score = calcDomainScore(domain, state.checkedIds);
  const Icon = domain.icon;
  const totalItems = domain.categories.reduce((a, c) => a + c.items.length, 0);
  const completedItems = domain.categories.reduce(
    (a, c) => a + c.items.filter(i => state.checkedIds.has(i.id)).length, 0
  );

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: domain.colorBg }}
          >
            <Icon className="w-7 h-7" style={{ color: domain.color }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{domain.name}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{domain.description}</p>
            <p className="text-xs text-slate-500 mt-1">
              {completedItems} of {totalItems} items completed
            </p>
          </div>
        </div>
        <ReadinessGauge score={score} size={120} />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-500" />
        {['all', 'todo', 'done'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : f === 'todo' ? 'To Do' : 'Done'}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {domain.categories.map(cat => (
          <CategorySection
            key={cat.name}
            category={cat}
            domain={domain}
            checkedIds={state.checkedIds}
            onToggle={(id) => dispatch({ type: 'TOGGLE_ITEM', id })}
            filter={filter}
          />
        ))}
      </div>
    </div>
  );
}
