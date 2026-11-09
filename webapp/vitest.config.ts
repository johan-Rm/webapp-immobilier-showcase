import { fileURLToPath } from 'node:url'

import { configDefaults, defineConfig } from 'vitest/config'

const resolvePath = (path: string): string => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '#shared': resolvePath('./shared'),
      '#shared/': `${resolvePath('./shared')}/`,
      '@schemas': resolvePath('./schemas'),
      '@schemas/': `${resolvePath('./schemas')}/`,
      '@services': resolvePath('./services'),
      '@services/': `${resolvePath('./services')}/`,
      '~': resolvePath('./app'),
      '~/': `${resolvePath('./app')}/`,
    },
  },
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, '**/worktree/**', '**/.worktrees/**'],
    include: ['**/*.vitest.ts'],
  },
})
