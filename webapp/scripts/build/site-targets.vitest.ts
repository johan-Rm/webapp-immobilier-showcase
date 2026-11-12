import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

import { afterEach, expect, it } from 'vitest'

import { siteTypeScriptPaths } from './site'

const roots: string[] = []
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })))

it('compose les sites et le dashboard avec des sources, types et sorties isolés', () => {
  const webapp = resolve(import.meta.dirname, '../..')
  const root = mkdtempSync(join(tmpdir(), 'nuxt-targets-'))
  roots.push(root)
  const file = (path: string, text: string) => {
    const absolute = join(root, path)
    mkdirSync(dirname(absolute), { recursive: true })
    writeFileSync(absolute, text)
  }
  mkdirSync(join(root, 'scripts/build'), { recursive: true })
  cpSync(join(webapp, 'scripts/build/site.ts'), join(root, 'scripts/build/site.ts'))
  cpSync(join(webapp, 'scripts/build/schema-hook.ts'), join(root, 'scripts/build/schema-hook.ts'))
  cpSync(join(webapp, 'services'), join(root, 'services'), { recursive: true })
  cpSync(join(webapp, 'schemas/source'), join(root, 'schemas/source'), { recursive: true })
  cpSync(join(webapp, 'nuxt.config.ts'), join(root, 'nuxt.config.ts'))
  cpSync(join(webapp, 'tsconfig.json'), join(root, 'tsconfig.json'))
  symlinkSync(join(webapp, 'node_modules'), join(root, 'node_modules'), 'dir')
  cpSync(join(webapp, 'shared'), join(root, 'shared'), { recursive: true })
  file('package.json', '{"type":"module"}')
  file(
    'base/real-estate/nuxt.config.ts',
    "export default defineNuxtConfig({ srcDir: '.', components: [{path: './components', pathPrefix: true}] })",
  )
  file('base/real-estate/components/screen/Probe.vue', '<template><div>Catalogue</div></template>')
  file('server/api/showcase.get.ts', "export default defineEventHandler(() => 'showcase')")
  for (const id of ['showcase-immobilier', 'client2-immobilier']) {
    file(`sites/${id}/site.ts`, `export default { id: '${id}', name: '${id}' }`)
    file(`sites/${id}/app/app.vue`, '<template><NuxtPage /></template>')
    file(`sites/${id}/app/pages/index.vue`, `<template><h1>${id}</h1></template>`)
    file(
      `sites/${id}/nuxt.config.ts`,
      id === 'showcase-immobilier'
        ? "import { resolve } from 'node:path'; export default defineNuxtConfig({extends: ['../../base/real-estate'], serverDir: resolve(__dirname, '../../server')})"
        : "import { resolve } from 'node:path'; export default defineNuxtConfig({serverDir: resolve(__dirname, 'server')})",
    )
  }
  file('dashboard/site.ts', "export default { id: 'dashboard', name: 'Dashboard' }")
  file('dashboard/nuxt.config.ts', 'export default defineNuxtConfig({})')
  file('dashboard/app/app.vue', '<template><NuxtPage /></template>')
  file('dashboard/app/pages/index.vue', '<template><h1>Dashboard</h1></template>')
  cpSync(join(webapp, 'scripts/build/type-check.ts'), join(root, 'scripts/build/type-check.ts'))
  for (const id of ['showcase-immobilier', 'client2-immobilier', 'dashboard']) {
    const buildDir = id === 'dashboard' ? 'dashboard/.nuxt' : '.nuxt'
    rmSync(join(root, 'schemas/interfaces'), { recursive: true, force: true })
    rmSync(join(root, 'schemas/dtos'), { recursive: true, force: true })
    expect(existsSync(join(root, 'schemas/interfaces'))).toBe(false)
    const result = spawnSync('node', [join(root, 'node_modules/nuxt/bin/nuxt.mjs'), 'prepare'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 60000,
      env: {
        ...process.env,
        GD_TARGET: id,
        NUXT_TELEMETRY_DISABLED: '1',
        SCHEMAS_PATH: join(root, 'schemas/source'),
      },
    })
    expect(result.error, result.stderr).toBeUndefined()
    expect(result.status, result.stdout + result.stderr).toBe(0)
    expect(existsSync(join(root, 'schemas/interfaces/index.ts'))).toBe(true)
    expect(existsSync(join(root, 'schemas/dtos/index.ts'))).toBe(true)
    expect(readFileSync(join(root, 'schemas/dtos/article.ts'), 'utf8')).toContain('ArticleDto')
    const types = spawnSync(
      'node',
      [
        join(root, 'node_modules/vue-tsc/bin/vue-tsc.js'),
        '--noEmit',
        '--project',
        id === 'dashboard' ? 'dashboard/.nuxt/tsconfig.site.json' : 'tsconfig.json',
      ],
      {
        cwd: root,
        encoding: 'utf8',
        timeout: 60000,
      },
    )
    expect(types.error, types.stderr).toBeUndefined()
    expect(types.status, types.stdout + types.stderr).toBe(0)
    const components = readFileSync(join(root, buildDir, 'components.d.ts'), 'utf8')
    const routes = readFileSync(join(root, buildDir, 'types/nitro-routes.d.ts'), 'utf8')
    const tsconfig = readFileSync(join(root, buildDir, 'tsconfig.json'), 'utf8')
    expect(components.includes('ScreenProbe:')).toBe(id === 'showcase-immobilier')
    expect(routes.includes('/api/showcase')).toBe(id === 'showcase-immobilier')
    if (id !== 'dashboard') expect(tsconfig).toContain(`sites/${id}/app`)
    if (id === 'dashboard') {
      const include = JSON.parse(tsconfig).include as string[]
      expect(
        include.map((pattern) => resolve(root, buildDir, pattern.replace('/**/*', ''))),
      ).toContain(join(root, 'dashboard/app'))
      expect(tsconfig).not.toContain('sites/showcase-immobilier/app')
      expect(tsconfig).not.toContain('sites/client2-immobilier/app')
      const paths = JSON.parse(readFileSync(join(root, buildDir, 'tsconfig.site.json'), 'utf8'))
        .compilerOptions.paths
      expect(paths['~/*']).toEqual(['../../dashboard/app/*'])
    }
    expect(tsconfig).not.toContain(
      'sites/' +
        (id === 'showcase-immobilier' ? 'client2-immobilier' : 'showcase-immobilier') +
        '/app',
    )
  }
  // La cible vide construit avec les contrats communs, sans thème ni contenu Showcase.
  const build = spawnSync('node', [join(root, 'node_modules/nuxt/bin/nuxt.mjs'), 'build'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 90000,
    env: {
      ...process.env,
      GD_TARGET: 'client2-immobilier',
      SCHEMAS_PATH: join(root, 'schemas/source'),
      NODE_ENV: 'production',
      NUXT_TELEMETRY_DISABLED: '1',
    },
  })
  expect(build.error, build.stderr).toBeUndefined()
  expect(build.status, build.stdout + build.stderr).toBe(0)
  expect(existsSync(join(root, '.output/server/index.mjs'))).toBe(true)
  expect(existsSync(join(root, '.output/site'))).toBe(false)

  const dashboardBuild = spawnSync(
    'node',
    [join(root, 'node_modules/nuxt/bin/nuxt.mjs'), 'build'],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: 90000,
      env: {
        ...process.env,
        GD_TARGET: 'dashboard',
        SCHEMAS_PATH: join(root, 'schemas/source'),
        NODE_ENV: 'production',
        NUXT_TELEMETRY_DISABLED: '1',
      },
    },
  )
  expect(dashboardBuild.error, dashboardBuild.stderr).toBeUndefined()
  expect(dashboardBuild.status, dashboardBuild.stdout + dashboardBuild.stderr).toBe(0)
  expect(existsSync(join(root, 'dashboard/.output/server/index.mjs'))).toBe(true)
  expect(existsSync(join(root, '.output/server/index.mjs'))).toBe(true)
  expect(existsSync(join(root, 'dashboard/.output/site'))).toBe(false)
  const dashboardTypes = spawnSync('bun', ['scripts/build/type-check.ts'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 60000,
    env: {
      ...process.env,
      GD_TARGET: 'dashboard',
      SCHEMAS_PATH: join(root, 'schemas/source'),
      NUXT_TELEMETRY_DISABLED: '1',
    },
  })
  expect(dashboardTypes.error, dashboardTypes.stderr).toBeUndefined()
  expect(dashboardTypes.status, dashboardTypes.stdout + dashboardTypes.stderr).toBe(0)

  const unknown = spawnSync('node', [join(root, 'node_modules/nuxt/bin/nuxt.mjs'), 'prepare'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, GD_TARGET: 'unknown-client' },
    timeout: 60000,
  })
  expect(unknown.status).not.toBe(0)
  expect(unknown.stdout + unknown.stderr).toContain('Client inconnu')
}, 240000)

it('génère les alias compatibles sans importer une application voisine', () => {
  for (const id of ['showcase-immobilier', 'client2-immobilier']) {
    const paths = siteTypeScriptPaths(id)
    expect(paths['~/*']).toEqual([`../sites/${id}/app/*`])
    expect(paths['#imports']).toEqual(['./imports'])
    expect(paths['#components']).toEqual(['./components'])
    expect(paths['#site']).toEqual(['../shared/site/definition.d.ts'])
  }
})

it('génère les alias du dashboard sans répertoire sites/dashboard', () => {
  const paths = siteTypeScriptPaths('dashboard')
  expect(paths['~/*']).toEqual(['../../dashboard/app/*'])
  expect(paths['#site']).toEqual(['../../shared/site/definition.d.ts'])
  expect(paths['@locales/*']).toEqual(['../../dashboard/i18n/locales/*'])
  expect(JSON.stringify(paths)).not.toContain('sites/')
  expect(() => siteTypeScriptPaths('../dashboard')).toThrow()
})
