import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      // Only measure the pure-logic modules the suite actually exercises.
      // UI components, the React store wiring, and entry points are out of scope.
      include: [
        'src/data/domains.ts',
        'src/data/scenarios.ts',
        'src/hooks/useThreatLevel.ts',
        'src/services/dragonscope.ts',
      ],
    },
  },
});
