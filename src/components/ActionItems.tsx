import { useStore } from '../store';
import DOMAINS, { getActionItems } from '../data/domains';
import { CheckCircle2, ChevronRight, Zap } from 'lucide-react';

interface WeightBadgeProps {
  weight: 1 | 2 | 3;
}

function WeightBadge({ weight }: WeightBadgeProps) {
  if (weight === 3) return <span className="badge bg-rose-500/10 text-rose-400 border border-rose-500/15">Critical</span>;
  if (weight === 2) return <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/15">Important</span>;
  return <span className="badge bg-th-faint/10 text-th-muted border border-th-border/20">Nice to have</span>;
}

interface ActionItemsProps {
  limit?: number;
}

export default function ActionItems({ limit = 8 }: ActionItemsProps) {
  const { state, dispatch } = useStore();
  const actions = getActionItems(DOMAINS, state.checkedIds, limit);

  if (actions.length === 0) {
    return (
      <div className="card p-8 text-center animate-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4
                        shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-th-heading mb-1">All caught up!</h3>
        <p className="text-sm text-th-muted leading-relaxed">
          You've completed every action item. Outstanding resilience.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3 animate-in">
        <Zap className="w-4 h-4 text-amber-400" />
        <h3 className="text-[11px] font-semibold text-th-faint uppercase tracking-[0.15em]">
          Priority Actions
        </h3>
      </div>
      {actions.map((item, i) => (
        <div
          key={item.id}
          className={`card-hover p-4 flex items-start gap-3 animate-in stagger-${Math.min(i + 1, 10)}
                     hover-glow`}
          style={{ '--card-glow-color': item.domainColor } as React.CSSProperties}
        >
          <input
            type="checkbox"
            checked={state.checkedIds.has(item.id)}
            onChange={() => dispatch({ type: 'TOGGLE_ITEM', id: item.id })}
            className="mt-0.5 w-5 h-5 rounded-lg border-2 border-th-border-alt/60 bg-th-input/50
                       text-emerald-500 focus:ring-emerald-500/25 focus:ring-offset-0 focus:ring-2
                       cursor-pointer transition-all duration-250"
            aria-label={`Mark "${item.text}" as complete`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-th-body">{item.text}</span>
              <WeightBadge weight={item.weight} />
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: item.domainColor }}
              />
              <span className="text-xs text-th-faint">{item.domainName} &middot; {item.category}</span>
            </div>
            {item.tips && (
              <p className="text-xs text-th-faint mt-1.5 leading-relaxed">{item.tips}</p>
            )}
          </div>
          <button
            className="flex-shrink-0 text-th-faint hover:text-th-muted transition-all duration-200
                       hover:translate-x-0.5 p-1 rounded-lg hover:bg-th-card-alt/30"
            onClick={() => dispatch({ type: 'NAVIGATE', view: `domain:${item.domainId}` })}
            aria-label={`Go to ${item.domainName} domain`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
