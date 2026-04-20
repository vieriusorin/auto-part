import { nodeVitestConfig } from '@autocare/vitest-config/node'
import { defineConfig, mergeConfig } from 'vitest/config'

export default mergeConfig(
  nodeVitestConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.ts'],
      coverage: {
        include: ['src/modules/**/*.ts'],
      },
    },
  }),
)
