import { useState } from 'react';
import { Shield, CheckCircle2, BarChart3, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: Shield,
    title: 'Welcome to ReadyState',
    body: 'Your personal resilience intelligence dashboard. Track your preparedness across critical life domains.',
    color: '#10b981',
  },
  {
    icon: CheckCircle2,
    title: 'Complete Checklist Items',
    body: 'Each domain has actionable items ranked by importance. Check them off as you prepare — your scores update in real time.',
    color: '#3b82f6',
  },
  {
    icon: BarChart3,
    title: 'Track Your Progress',
    body: 'Watch your readiness score grow over time. The radar chart shows your balance across all domains.',
    color: '#eab308',
  },
  {
    icon: AlertTriangle,
    title: 'Scenario Planning',
    body: 'See how prepared you are for specific crisis scenarios. Live market data adjusts threat levels automatically.',
    color: '#f59e0b',
  },
] as const;

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="card p-8 max-w-md w-full mx-4 animate-in relative">
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 text-th-faint hover:text-th-muted transition-colors"
          aria-label="Skip onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: current.color + '15' }}
          >
            <Icon className="w-8 h-8" style={{ color: current.color }} />
          </div>

          <h2 className="text-xl font-bold text-th-heading mb-2">{current.title}</h2>
          <p className="text-sm text-th-muted leading-relaxed mb-6">{current.body}</p>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-emerald-500' : 'w-1.5 bg-th-border'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm text-th-muted hover:text-th-heading transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={isLast ? onComplete : () => setStep(step + 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                         bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            >
              {isLast ? 'Get Started' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
