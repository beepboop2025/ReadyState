import { useMemo, useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import DOMAINS, { calcDomainScore } from '../data/domains';
import ReadinessGauge from './ReadinessGauge';
import type { DomainCategory, Domain } from '../types';
import {
  ChevronLeft, ChevronDown, Lightbulb, Filter, Search,
  Sparkles,
} from 'lucide-react';

interface WeightDotProps {
  weight: 1 | 2 | 3;
}

function WeightDot({ weight }: WeightDotProps) {
  if (weight === 3) return <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0 shadow-sm shadow-rose-500/30 animate-pulse-subtle" title="Critical" />;
  if (weight === 2) return <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 shadow-sm shadow-amber-500/30" title="Important" />;
  return <span className="w-2 h-2 rounded-full bg-th-faint flex-shrink-0" title="Nice to have" />;
}

type FilterType = 'all' | 'todo' | 'done';

/** Sparkle burst that appears when a category hits 100% */
function CompletionCelebration() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-10">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${5 + Math.random() * 90}%`,
            animation: `celebrationBurst 0.8s ease-out ${i * 0.06}s both`,
          }}
        >
          <Sparkles
            className="w-4 h-4"
            style={{
              color: ['#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#a78bfa', '#60a5fa', '#f472b6', '#818cf8'][i % 8],
            }}
          />
        </div>
      ))}
      {/* Ripple effect */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full
                   border-2 border-emerald-400/50 animate-ripple"
      />
    </div>
  );
}

interface CategorySectionProps {
  category: DomainCategory;
  domain: Domain;
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
  filter: FilterType;
  searchQuery: string;
  index: number;
}

function CategorySection({ category, domain, checkedIds, onToggle, filter, searchQuery, index }: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const prevPctRef = useRef(0);
  const [showCelebration, setShowCelebration] = useState(false);

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

  // Detect 100% completion
  useEffect(() => {
    if (prevPctRef.current < 100 && pct === 100) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2500);
      return () => clearTimeout(timer);
    }
    prevPctRef.current = pct;
  }, [pct]);

  if (items.length === 0) return null;

  const barGradient =
    pct === 100 ? 'from-emerald-400 to-emerald-300' :
    pct >= 60 ? 'from-emerald-500 to-emerald-400' :
    pct >= 30 ? 'from-amber-500 to-amber-400' :
                'from-rose-500 to-rose-400';

  return (
    <div className={`card overflow-hidden animate-in stagger-${Math.min(index + 1, 10)} relative
                     transition-shadow duration-500
                     ${pct === 100 ? 'glow-emerald' : ''}`}>
      {showCelebration && <CompletionCelebration />}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-th-card-alt/20 transition-all duration-200"
        aria-expanded={!collapsed}
        aria-label={`${category.name}: ${completed} of ${total} completed`}
      >
        <div
          className="w-1.5 h-8 rounded-full flex-shrink-0 transition-all duration-500"
          style={{
            background: `linear-gradient(to bottom, ${domain.color}, ${domain.color}88)`,
            opacity: 0.4 + (pct / 100) * 0.6,
            boxShadow: pct >= 60 ? `0 0 8px -2px ${domain.color}40` : 'none',
          }}
        />
        <div className="flex-1 text-left">
          <h3 className="text-sm font-semibold text-th-heading">{category.name}</h3>
          <p className="text-xs text-th-faint mt-0.5">{completed} of {total} completed</p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-24 progress-track hidden sm:block"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`progress-fill bg-gradient-to-r ${barGradient}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span
            className="text-sm font-semibold score-label transition-colors duration-300"
            style={{ color: domain.color }}
          >
            {pct}%
          </span>
          <div className={`transition-transform duration-300 ${collapsed ? 'rotate-0' : 'rotate-180'}`}>
            <ChevronDown className="w-4 h-4 text-th-faint" />
          </div>
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-400 ease-out ${
          collapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
        }`}
      >
        <div className="border-t border-th-border/30">
          {items.map((item, itemIdx) => {
            const checked = checkedIds.has(item.id);
            return (
              <label
                key={item.id}
                className={`
                  check-item flex items-start gap-3 px-5 py-3.5 cursor-pointer
                  border-b border-th-border/15 last:border-b-0
                  hover:bg-th-card-alt/15 transition-all duration-200
                  ${checked ? 'opacity-60' : ''}
                `}
                style={{ transitionDelay: collapsed ? '0ms' : `${itemIdx * 20}ms` }}
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
                    <span className={`text-sm transition-all duration-300 ${
                      checked ? 'line-through text-th-faint' : 'text-th-body'
                    }`}>
                      {item.text}
                    </span>
                  </div>
                  {item.tips && !checked && (
                    <div className="flex items-start gap-1.5 mt-2 ml-4 animate-fade-in">
                      <Lightbulb className="w-3 h-3 text-amber-500/60 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-th-faint leading-relaxed">{item.tips}</span>
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>
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
    <div className="space-y-6 page-fade">
      <button
        onClick={() => dispatch({ type: 'NAVIGATE', view: 'dashboard' })}
        className="flex items-center gap-1 text-sm text-th-muted hover:text-th-heading
                   transition-all duration-200 hover:-translate-x-0.5 animate-in"
      >
        <ChevronLeft className="w-4 h-4" />
        Dashboard
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 animate-in stagger-1">
        <div className="flex items-center gap-4 flex-1">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center
                       transition-all duration-300 hover:scale-105 hover-glow"
            style={{
              background: domain.colorBg,
              '--card-glow-color': domain.color,
            } as React.CSSProperties}
          >
            <Icon className="w-7 h-7" style={{ color: domain.color }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-th-heading">{domain.name}</h2>
            <p className="text-sm text-th-muted mt-0.5 leading-relaxed">{domain.description}</p>
            <p className="text-xs text-th-faint mt-1">
              {completedItems} of {totalItems} items completed
            </p>
          </div>
        </div>
        <ReadinessGauge score={score} size={120} />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-in stagger-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-faint" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-9 pr-3 py-2.5 bg-th-input/60 backdrop-blur-sm
                       border border-th-border/50 rounded-xl text-sm
                       text-th-heading placeholder-th-faint
                       focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/40
                       transition-all duration-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-th-faint" />
          {(['all', 'todo', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-250 ${
                filter === f
                  ? 'bg-th-input/80 text-th-heading border border-th-border-alt/50 shadow-sm'
                  : 'text-th-muted hover:text-th-heading hover:bg-th-card-alt/30 border border-transparent'
              }`}
            >
              {f === 'all' ? 'All' : f === 'todo' ? 'To Do' : 'Done'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {domain.categories.map((cat, i) => (
          <CategorySection
            key={cat.name}
            category={cat}
            domain={domain}
            checkedIds={state.checkedIds}
            onToggle={(id) => dispatch({ type: 'TOGGLE_ITEM', id })}
            filter={filter}
            searchQuery={searchQuery}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
