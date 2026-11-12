import { fileURLToPath } from 'node:url'

import { configDefaults, defineConfig } from 'vitest/config'

import { resolveApplicationTarget } from './shared/site/registry.ts'

const resolvePath = (path: string): string => fileURLToPath(new URL(path, import.meta.url))
const target = resolveApplicationTarget(process.env.GD_TARGET)
const app = `./${target.root}/app`

export default defineConfig({
  resolve: {
    alias: {
      '#site': resolvePath(`./${target.root}/site.ts`),
      '#shared': resolvePath('./shared'),
      '#shared/': `${resolvePath('./shared')}/`,
      '@schemas': resolvePath('./schemas'),
      '@schemas/': `${resolvePath('./schemas')}/`,
      '@services': resolvePath('./services'),
      '@services/': `${resolvePath('./services')}/`,
      '@locales': resolvePath(
        target.kind === 'dashboard' ? './dashboard/i18n/locales' : './i18n/locales',
      ),
      '@': resolvePath(app),
      '@utils': resolvePath(`${app}/utils`),
      '@site-assets': resolvePath(`${app}/assets`),
      '~': resolvePath(app),
      '~/': `${resolvePath(app)}/`,
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
      `${target.root}/**/*.vitest.ts`,
      ...(target.id === 'showcase-immobilier' ? ['server/**/*.vitest.ts'] : []),
      ...(target.kind === 'dashboard' ? ['server/tests/saas-*.vitest.ts'] : []),
    ],
  },
})
