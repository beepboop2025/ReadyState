import { useMemo, useState } from 'react';
import { useStore } from '../store';
import DOMAINS, { calcDomainScore } from '../data/domains';
import ReadinessGauge from './ReadinessGauge';
import type { DomainCategory, Domain } from '../types';
import {
  ChevronLeft, ChevronDown, ChevronUp, Lightbulb, Filter, Search,
} from 'lucide-react';

interface WeightDotProps {
  weight: 1 | 2 | 3;
}

function WeightDot({ weight }: WeightDotProps) {
  if (weight === 3) return <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" title="Critical" />;
  if (weight === 2) return <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Important" />;
  return <span className="w-2 h-2 rounded-full bg-th-faint flex-shrink-0" title="Nice to have" />;
}

type FilterType = 'all' | 'todo' | 'done';

interface CategorySectionProps {
  category: DomainCategory;
  domain: Domain;
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
  filter: FilterType;
  searchQuery: string;
}

function CategorySection({ category, domain, checkedIds, onToggle, filter, searchQuery }: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const items = useMemo(() => {
    let filtered = category.items;
    if (filter === 'todo') filtered = filtered.filter(i => !checkedIds.has(i.id));
    else if (filter === 'done') filtered = filtered.filter(i => checkedIds.has(i.id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        i.text.toLowerCase().includes(q) || i.tips.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [category.items, filter, checkedIds, searchQuery]);

  const completed = category.items.filter(i => checkedIds.has(i.id)).length;
  const total = category.items.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  if (items.length === 0) return null;

  return (
    <div className="card overflow-hidden animate-in">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-th-card-alt/30 transition-colors"
        aria-expanded={!collapsed}
        aria-label={`${category.name}: ${completed} of ${total} completed`}
      >
        <div
          className="w-1.5 h-8 rounded-full flex-shrink-0"
          style={{ background: domain.color }}
        />
        <div className="flex-1 text-left">
          <h3 className="text-sm font-semibold text-th-heading">{category.name}</h3>
          <p className="text-xs text-th-faint mt-0.5">{completed} of {total} completed</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 progress-track hidden sm:block" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="progress-fill"
              style={{ width: `${pct}%`, background: domain.color }}
            />
          </div>
          <span className="text-sm font-semibold score-label" style={{ color: domain.color }}>
            {pct}%
          </span>
          {collapsed ? <ChevronDown className="w-4 h-4 text-th-faint" /> : <ChevronUp className="w-4 h-4 text-th-faint" />}
        </div>
      </button>

      {!collapsed && (
        <div className="border-t border-th-border/40">
          {items.map((item) => {
            const checked = checkedIds.has(item.id);
            return (
              <label
                key={item.id}
                className={`
                  check-item flex items-start gap-3 px-5 py-3.5 cursor-pointer
                  border-b border-th-border/20 last:border-b-0
                  hover:bg-th-card-alt/20 transition-colors
                  ${checked ? 'opacity-60' : ''}
                `}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.id)}
                  className="mt-0.5"
                  aria-label={item.text}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <WeightDot weight={item.weight} />
                    <span className={`text-sm ${checked ? 'line-through text-th-faint' : 'text-th-body'}`}>
                      {item.text}
                    </span>
                  </div>
                  {item.tips && !checked && (
                    <div className="flex items-start gap-1.5 mt-2 ml-4">
                      <Lightbulb className="w-3 h-3 text-amber-500/70 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-th-faint leading-relaxed">{item.tips}</span>
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

interface DomainViewProps {
  domainId: string;
}

export default function DomainView({ domainId }: DomainViewProps) {
  const { state, dispatch } = useStore();
  const domain = DOMAINS.find(d => d.id === domainId);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!domain) {
    return (
      <div className="text-center py-20">
        <p className="text-th-muted">Domain not found.</p>
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
      <button
        onClick={() => dispatch({ type: 'NAVIGATE', view: 'dashboard' })}
        className="flex items-center gap-1 text-sm text-th-muted hover:text-th-heading transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Dashboard
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: domain.colorBg }}
          >
            <Icon className="w-7 h-7" style={{ color: domain.color }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-th-heading">{domain.name}</h2>
            <p className="text-sm text-th-muted mt-0.5">{domain.description}</p>
            <p className="text-xs text-th-faint mt-1">
              {completedItems} of {totalItems} items completed
            </p>
          </div>
        </div>
        <ReadinessGauge score={score} size={120} />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-faint" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-9 pr-3 py-2 bg-th-input border border-th-border-alt rounded-xl text-sm
                       text-th-heading placeholder-th-faint focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-th-faint" />
          {(['all', 'todo', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-th-input text-th-heading'
                  : 'text-th-muted hover:text-th-heading'
              }`}
            >
              {f === 'all' ? 'All' : f === 'todo' ? 'To Do' : 'Done'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {domain.categories.map(cat => (
          <CategorySection
            key={cat.name}
            category={cat}
            domain={domain}
            checkedIds={state.checkedIds}
            onToggle={(id) => dispatch({ type: 'TOGGLE_ITEM', id })}
            filter={filter}
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </div>
  );
}
