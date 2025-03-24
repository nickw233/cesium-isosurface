import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    includeSource: ['src/**/*.{ts,tsx}'],
    outputFile: './tests/report/index.html',
    testTimeout: 2 * 60 * 1000,
    globals: true,
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    exclude: ['**/demo/**'],
    coverage: {
      enabled: true,
      reporter: ['html'],
      reportsDirectory: './tests/coverage',
      provider: 'istanbul',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/src/**/*.spec.ts', '**/src/**/*.test.ts'],
    },
  },

  resolve: {
    alias: {},
  },
});
