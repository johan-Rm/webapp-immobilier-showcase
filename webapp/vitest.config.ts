import { fileURLToPath } from 'node:url'

import { configDefaults, defineConfig } from 'vitest/config'

import { mutationTestFiles } from './scripts/quality/mutation-test-selection.ts'
import { buildPlan, nodeTestFiles, webappRoot } from './scripts/quality/run.ts'
import { resolveApplicationTarget } from './shared/site/registry.ts'

const resolvePath = (path: string): string => fileURLToPath(new URL(path, import.meta.url))
const target = resolveApplicationTarget(process.env.GD_TARGET)
const app = `./${target.root}/app`

const family = process.env.VERIFY_FAMILY
const nodeIncludes =
  family === 'unit' || family === 'integration'
    ? buildPlan({
        family,
        target: target.id as 'showcase-immobilier' | 'client2-immobilier' | 'dashboard',
        list: true,
      }).files.filter((file) => file.endsWith('.vitest.ts'))
    : (family === 'mutation' ? mutationTestFiles : nodeTestFiles)(
        webappRoot,
        target.id as 'showcase-immobilier' | 'client2-immobilier' | 'dashboard',
      )

const nodeConfig = {
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
    // Les suites d’intégration lancent leurs propres processus Nuxt et outils CLI.
    maxWorkers: family === 'integration' || family === 'mutation' ? 2 : undefined,
    exclude: [
      ...configDefaults.exclude,
      '**/worktree/**',
      '**/.worktrees/**',
      '**/*.nuxt.vitest.ts',
    ],
    include: nodeIncludes,
  },
}

export default defineConfig(async (configEnv) => {
  if (family !== 'components') return nodeConfig
  const { defineVitestConfig } = await import('@nuxt/test-utils/config')
  return defineVitestConfig({
    root: webappRoot,
    test: {
      name: 'nuxt-components',
      environment: 'nuxt',
      include: [`${target.root}/**/*.nuxt.vitest.ts`],
      environmentOptions: {
        nuxt: {
          rootDir: resolvePath(`./.tmp/quality/components/${target.id}`),
          dotenv: { cwd: webappRoot, fileName: '.env.test' },
          overrides: {
            extends: [webappRoot],
            buildDir: resolvePath(`./.tmp/quality/components/${target.id}/.nuxt`),
            alias: { '#shared': resolvePath('./shared') },
            devtools: { enabled: false },
          },
        },
      },
    },
  })(configEnv)
})
