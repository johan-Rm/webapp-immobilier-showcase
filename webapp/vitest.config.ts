import { fileURLToPath } from 'node:url'

import { configDefaults, defineConfig } from 'vitest/config'

import { resolveSiteId } from './shared/site/registry.ts'

const resolvePath = (path: string): string => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '#site': resolvePath(`./sites/${resolveSiteId(process.env.GD_TARGET)}/site.ts`),
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
