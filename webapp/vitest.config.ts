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
      '@': resolvePath(`./sites/${resolveSiteId(process.env.GD_TARGET)}/app`),
      '@utils': resolvePath(`./sites/${resolveSiteId(process.env.GD_TARGET)}/app/utils`),
      '@site-assets': resolvePath(`./sites/${resolveSiteId(process.env.GD_TARGET)}/app/assets`),
      '~': resolvePath(`./sites/${resolveSiteId(process.env.GD_TARGET)}/app`),
      '~/': `${resolvePath(`./sites/${resolveSiteId(process.env.GD_TARGET)}/app`)}/`,
    },
  },
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, '**/worktree/**', '**/.worktrees/**'],
    include: [
      'scripts/**/*.vitest.ts',
      'services/**/*.vitest.ts',
      'shared/**/*.vitest.ts',
      'tests/**/*.vitest.ts',
      `sites/${resolveSiteId(process.env.GD_TARGET)}/**/*.vitest.ts`,
      ...(resolveSiteId(process.env.GD_TARGET) === 'showcase-immobilier'
        ? ['server/**/*.vitest.ts']
        : []),
    ],
  },
})
