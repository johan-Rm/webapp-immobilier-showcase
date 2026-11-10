import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { expect, it } from 'vitest'

it('prépare le vrai Client 2 sans les composants, routes et initialisations Showcase', () => {
  const webapp = resolve(import.meta.dirname, '../..')
  const root = mkdtempSync(join(tmpdir(), 'client2-layer-'))
  try {
    symlinkSync(join(webapp, 'node_modules'), join(root, 'node_modules'), 'dir')
    symlinkSync(join(webapp, 'shared'), join(root, 'shared'), 'dir')
    mkdirSync(join(root, 'scripts/build'), { recursive: true })
    cpSync(join(webapp, 'scripts/build/site.ts'), join(root, 'scripts/build/site.ts'))
    cpSync(join(webapp, 'nuxt.config.ts'), join(root, 'nuxt.config.ts'))
    cpSync(join(webapp, 'sites/client2-immobilier'), join(root, 'sites/client2-immobilier'), {
      recursive: true,
    })
    writeFileSync(join(root, 'package.json'), '{"type":"module"}')
    const result = spawnSync('node', [join(root, 'node_modules/nuxt/bin/nuxt.mjs'), 'prepare'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, GD_TARGET: 'client2-immobilier', NUXT_TELEMETRY_DISABLED: '1' },
    })
    expect(result.status, result.stdout + result.stderr).toBe(0)
    const components = readFileSync(join(root, '.nuxt/components.d.ts'), 'utf8')
    const imports = readFileSync(join(root, '.nuxt/imports.d.ts'), 'utf8')
    const routes = readFileSync(join(root, '.nuxt/types/nitro-routes.d.ts'), 'utf8')
    const runtime = readFileSync(join(root, '.nuxt/types/runtime-config.d.ts'), 'utf8')
    for (const content of [components, imports, routes, runtime]) {
      expect(content).not.toContain('sites/showcase-immobilier')
      expect(content).not.toContain('ScreenProperty')
      expect(content).not.toContain('useNuxtServerInit')
      expect(content).not.toContain('/api/auth')
      expect(content).not.toContain('symfony')
    }
    for (const path of ['content', 'themes.yaml', '.env', 'app/pages/dashboard']) {
      expect(existsSync(join(root, 'sites/client2-immobilier', path))).toBe(false)
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}, 60000)
