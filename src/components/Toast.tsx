import { useState, useEffect, useCallback, createContext, useContext, useRef, type ReactNode } from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import type { Toast } from '../types';

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting'>('entering');

  useEffect(() => {
    // Enter animation
    const enterTimer = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase('visible'));
    });

    const dur = toast.duration ?? 4000;
    const exitTimer = setTimeout(() => setPhase('exiting'), dur - 500);
    const removeTimer = setTimeout(onDismiss, dur);
    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.duration, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />,
  };

  const glowColors = {
    success: '0 0 24px -6px rgba(16,185,129,0.25)',
    info: '0 0 24px -6px rgba(59,130,246,0.25)',
    warning: '0 0 24px -6px rgba(245,158,11,0.25)',
  };

  const borders = {
    success: 'border-emerald-500/25',
    info: 'border-blue-500/25',
    warning: 'border-amber-500/25',
  };

  const accentBg = {
    success: 'bg-gradient-to-r from-emerald-500/5 to-transparent',
    info: 'bg-gradient-to-r from-blue-500/5 to-transparent',
    warning: 'bg-gradient-to-r from-amber-500/5 to-transparent',
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3.5 rounded-xl border
        bg-th-card/90 backdrop-blur-xl
        ${borders[toast.type]}
        ${accentBg[toast.type]}
        transition-all duration-500 ease-out
        ${phase === 'entering' ? 'opacity-0 translate-x-12 scale-95' : ''}
        ${phase === 'exiting' ? 'opacity-0 translate-x-12 scale-95' : ''}
        ${phase === 'visible' ? 'opacity-100 translate-x-0 scale-100' : ''}
      `}
      style={{
        boxShadow: `0 8px 32px -8px rgba(0,0,0,0.3), ${glowColors[toast.type]}`,
        transitionTimingFunction: phase === 'visible'
          ? 'cubic-bezier(0.22, 1, 0.36, 1)'
          : 'cubic-bezier(0.55, 0, 1, 0.45)',
      }}
      role="status"
      aria-live="polite"
    >
      {icons[toast.type]}
      <span className="text-sm text-th-body flex-1 leading-relaxed">{toast.message}</span>
      <button
        onClick={() => { setPhase('exiting'); setTimeout(onDismiss, 500); }}
        className="text-th-faint hover:text-th-muted transition-colors duration-200
                   p-0.5 rounded-md hover:bg-th-card-alt/40"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `toast-${++counterRef.current}`;
    setToasts(prev => [...prev.slice(-4), { ...t, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Stack */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 max-w-sm" aria-label="Notifications">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
