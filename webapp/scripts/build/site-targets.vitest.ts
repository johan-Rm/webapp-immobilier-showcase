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

const roots: string[] = []
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })))

it('compose deux sources et serveurs isolés avec la vraie configuration racine', () => {
  const webapp = resolve(import.meta.dirname, '../..')
  const root = mkdtempSync(join(tmpdir(), 'nuxt-targets-'))
  roots.push(root)
  const file = (path: string, text: string) => {
    const absolute = join(root, path)
    mkdirSync(dirname(absolute), { recursive: true })
    writeFileSync(absolute, text)
  }
  cpSync(join(webapp, 'nuxt.config.ts'), join(root, 'nuxt.config.ts'))
  cpSync(join(webapp, 'tsconfig.json'), join(root, 'tsconfig.json'))
  symlinkSync(join(webapp, 'node_modules'), join(root, 'node_modules'), 'dir')
  symlinkSync(join(webapp, 'shared'), join(root, 'shared'), 'dir')
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
  for (const id of ['showcase-immobilier', 'client2-immobilier']) {
    const result = spawnSync('node', [join(root, 'node_modules/nuxt/bin/nuxt.mjs'), 'prepare'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, GD_TARGET: id, NUXT_TELEMETRY_DISABLED: '1' },
    })
    expect(result.error, result.stderr).toBeUndefined()
    expect(result.status, result.stdout + result.stderr).toBe(0)
    const components = readFileSync(join(root, '.nuxt/components.d.ts'), 'utf8')
    const routes = readFileSync(join(root, '.nuxt/types/nitro-routes.d.ts'), 'utf8')
    const tsconfig = readFileSync(join(root, '.nuxt/tsconfig.json'), 'utf8')
    expect(components.includes('ScreenProbe:')).toBe(id === 'showcase-immobilier')
    expect(routes.includes('/api/showcase')).toBe(id === 'showcase-immobilier')
    expect(tsconfig).toContain(`sites/${id}/app`)
    expect(tsconfig).not.toContain(
      'sites/' +
        (id === 'showcase-immobilier' ? 'client2-immobilier' : 'showcase-immobilier') +
        '/app',
    )
  }
  // La cible vide doit construire sans thème, contenu ni hook de schémas.
  const build = spawnSync('node', [join(root, 'node_modules/nuxt/bin/nuxt.mjs'), 'build'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 90000,
    env: {
      ...process.env,
      GD_TARGET: 'client2-immobilier',
      NODE_ENV: 'production',
      NUXT_TELEMETRY_DISABLED: '1',
    },
  })
  expect(build.error, build.stderr).toBeUndefined()
  expect(build.status, build.stdout + build.stderr).toBe(0)
  expect(existsSync(join(root, '.output/server/index.mjs'))).toBe(true)
  expect(existsSync(join(root, '.output/site'))).toBe(false)

  const unknown = spawnSync('node', [join(root, 'node_modules/nuxt/bin/nuxt.mjs'), 'prepare'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, GD_TARGET: 'unknown-client' },
    timeout: 60000,
  })
  expect(unknown.status).not.toBe(0)
  expect(unknown.stdout + unknown.stderr).toContain('Client inconnu')
}, 180000)
