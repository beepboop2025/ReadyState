import { useStore } from '../store';
import DOMAINS, { getActionItems } from '../data/domains';
import { AlertTriangle, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

function WeightBadge({ weight }) {
  if (weight === 3) return <span className="badge bg-rose-500/15 text-rose-400">Critical</span>;
  if (weight === 2) return <span className="badge bg-amber-500/15 text-amber-400">Important</span>;
  return <span className="badge bg-slate-500/15 text-slate-400">Nice to have</span>;
}

export default function ActionItems({ limit = 8 }) {
  const { state, dispatch } = useStore();
  const actions = getActionItems(DOMAINS, state.checkedIds, limit);

  if (actions.length === 0) {
    return (
      <div className="card p-6 text-center animate-in">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-1">All caught up!</h3>
        <p className="text-sm text-slate-400">You've completed every action item. Outstanding resilience.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Priority Actions</h3>
      </div>
      {actions.map((item, i) => (
        <div
          key={item.id}
          className="card-hover p-4 flex items-start gap-3 animate-in"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <input
            type="checkbox"
            checked={state.checkedIds.has(item.id)}
            onChange={() => dispatch({ type: 'TOGGLE_ITEM', id: item.id })}
            className="mt-0.5 rounded border-slate-600 bg-slate-800 text-emerald-500
                       focus:ring-emerald-500/30 focus:ring-offset-0 focus:ring-2 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-200">{item.text}</span>
              <WeightBadge weight={item.weight} />
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: item.domainColor }}
              />
              <span className="text-xs text-slate-500">{item.domainName} &middot; {item.category}</span>
            </div>
            {item.tips && (
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item.tips}</p>
            )}
          </div>
          <button
            className="flex-shrink-0 text-slate-600 hover:text-slate-400 transition-colors"
            onClick={() => dispatch({ type: 'NAVIGATE', view: `domain:${item.domainId}` })}
            title="Go to domain"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
