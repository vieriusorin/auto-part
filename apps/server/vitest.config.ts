import { defineConfig, mergeConfig } from 'vitest/config'
import { nodeVitestConfig } from '../../packages/vitest-config/node'

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
