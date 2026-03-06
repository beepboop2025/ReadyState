import { useEffect, useRef } from 'react';
import { useScores } from '../store';
import { useToast } from '../components/Toast';
import DOMAINS from '../data/domains';

const MILESTONES = [25, 50, 75, 100] as const;

/**
 * Watches score changes and fires celebration toasts when milestones are crossed.
 * Tracks previous scores to only fire once per milestone crossing.
 */
export function useCelebrations() {
  const { domainScores, overall } = useScores();
  const { addToast } = useToast();
  const prevOverall = useRef(overall);
  const prevDomainScores = useRef<Record<string, number>>({ ...domainScores });
  const initialized = useRef(false);

  useEffect(() => {
    // Skip the first render (don't celebrate existing state on page load)
    if (!initialized.current) {
      initialized.current = true;
      prevOverall.current = overall;
      prevDomainScores.current = { ...domainScores };
      return;
    }

    // Check overall milestones
    for (const milestone of MILESTONES) {
      if (prevOverall.current < milestone && overall >= milestone) {
        const messages: Record<number, string> = {
          25: 'Your resilience journey is underway! 25% overall readiness.',
          50: 'Halfway there! 50% overall readiness reached.',
          75: 'Strong progress! 75% overall readiness.',
          100: 'Maximum readiness achieved! You are fully prepared.',
        };
        addToast({ message: messages[milestone], type: 'success', duration: 5000 });
      }
    }

    // Check domain completions (100%)
    for (const domain of DOMAINS) {
      const prev = prevDomainScores.current[domain.id] ?? 0;
      const curr = domainScores[domain.id] ?? 0;
      if (prev < 100 && curr >= 100) {
        addToast({
          message: `${domain.name} is fully prepared!`,
          type: 'success',
          duration: 4500,
        });
      }
    }

    prevOverall.current = overall;
    prevDomainScores.current = { ...domainScores };
  }, [overall, domainScores, addToast]);
}
