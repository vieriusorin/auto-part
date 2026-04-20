import { defineConfig } from 'vitest/config'

export const nodeVitestConfig = defineConfig({
  test: {
    environment: 'node',
    globals: false,
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/__tests__/**'],
    },
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
  },
})
