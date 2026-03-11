import { useState, useEffect } from 'react';
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
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  function goNext() {
    if (isLast) {
      onComplete();
    } else {
      setDirection('forward');
      setTransitioning(true);
    }
  }

  function goBack() {
    if (step > 0) {
      setDirection('back');
      setTransitioning(true);
    }
  }

  // Handle step transition
  useEffect(() => {
    if (!transitioning) return;
    const timer = setTimeout(() => {
      setStep(prev => direction === 'forward' ? prev + 1 : prev - 1);
      setTransitioning(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [transitioning, direction]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade">
      <div className="card p-8 max-w-md w-full mx-4 relative shadow-2xl overflow-hidden">
        {/* Ambient glow behind the icon */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl
                     transition-all duration-700 pointer-events-none"
          style={{
            background: current.color,
            opacity: 0.08,
          }}
        />

        <button
          onClick={onComplete}
          className="absolute top-4 right-4 text-th-faint hover:text-th-muted transition-all duration-200
                     p-1.5 rounded-lg hover:bg-th-card-alt/40 z-10"
          aria-label="Skip onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className={`flex flex-col items-center text-center transition-all duration-300 ease-out ${
            transitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            transform: transitioning
              ? `translateX(${direction === 'forward' ? '-20px' : '20px'}) scale(0.95)`
              : 'translateX(0) scale(1)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5
                       transition-all duration-500"
            style={{
              background: current.color + '12',
              boxShadow: `0 0 40px -8px ${current.color}40`,
            }}
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
                className={`rounded-full transition-all duration-500 ease-out ${
                  i === step
                    ? 'w-7 h-1.5'
                    : i < step
                    ? 'w-1.5 h-1.5'
                    : 'w-1.5 h-1.5'
                }`}
                style={{
                  background: i === step
                    ? current.color
                    : i < step
                    ? current.color + '80'
                    : 'rgb(var(--c-border))',
                  boxShadow: i === step ? `0 0 8px -2px ${current.color}60` : 'none',
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={goBack}
                className="px-4 py-2.5 text-sm text-th-muted hover:text-th-heading
                           transition-all duration-200 rounded-xl hover:bg-th-card-alt/30"
              >
                Back
              </button>
            )}
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                         text-white shadow-lg transition-all duration-300
                         hover:shadow-xl active:scale-[0.97]"
              style={{
                background: `linear-gradient(135deg, ${current.color}, ${current.color}cc)`,
                boxShadow: `0 4px 20px -4px ${current.color}40`,
              }}
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
