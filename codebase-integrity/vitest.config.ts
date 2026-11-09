import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['domaines/**/tests/*.vitest.ts'],
    exclude: [...configDefaults.exclude, '**/worktree/**'],
  },
})
