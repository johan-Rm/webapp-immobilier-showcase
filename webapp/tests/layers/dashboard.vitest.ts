import { spawnSync } from 'node:child_process'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'

import { expect, it } from 'vitest'

it('prépare la vraie layer dashboard sans charger Showcase ni ses routes métier', () => {
  const webapp = resolve(import.meta.dirname, '../..')
  const workspace = mkdtempSync(join(tmpdir(), 'dashboard-layer-'))
  const root = join(workspace, 'webapp')
  mkdirSync(root)
  try {
    cpSync(resolve(webapp, '../resources'), join(workspace, 'resources'), { recursive: true })
    symlinkSync(join(webapp, 'node_modules'), join(root, 'node_modules'), 'dir')
    for (const folder of ['shared', 'services', 'schemas/source', 'dashboard', 'server']) {
      cpSync(join(webapp, folder), join(root, folder), {
        recursive: true,
        filter: (source) => !['.nuxt', '.output', 'node_modules'].includes(basename(source)),
      })
    }
    mkdirSync(join(root, 'scripts/build'), { recursive: true })
    for (const file of ['site.ts', 'schema-hook.ts'])
      cpSync(join(webapp, 'scripts/build', file), join(root, 'scripts/build', file))
    cpSync(join(webapp, 'nuxt.config.ts'), join(root, 'nuxt.config.ts'))
    cpSync(join(webapp, 'tsconfig.json'), join(root, 'tsconfig.json'))
    writeFileSync(join(root, 'package.json'), '{"type":"module"}')
    const result = spawnSync('node', [join(root, 'node_modules/nuxt/bin/nuxt.mjs'), 'prepare'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 60000,
      env: {
        ...process.env,
        GD_TARGET: 'dashboard',
        NUXT_TELEMETRY_DISABLED: '1',
        SCHEMAS_PATH: join(root, 'schemas/source'),
      },
    })
    expect(result.error, result.stderr).toBeUndefined()
    expect(result.status, result.stdout + result.stderr).toBe(0)
    for (const file of [
      'components.d.ts',
      'imports.d.ts',
      'types/nitro-routes.d.ts',
      'types/runtime-config.d.ts',
    ]) {
      const source = readFileSync(join(root, 'dashboard/.nuxt', file), 'utf8')
      expect(source).not.toContain('sites/showcase-immobilier')
      expect(source).not.toContain('/api/dashboard/')
      expect(source).not.toContain('/auth/google')
      expect(source).not.toContain('symfonyProjectId')
    }
    const components = readFileSync(join(root, 'dashboard/.nuxt/components.d.ts'), 'utf8')
    expect(components).toContain('DashboardOverview')
    expect(components).toContain('DashboardAccessForm')
    const build = spawnSync('node', [join(root, 'node_modules/nuxt/bin/nuxt.mjs'), 'build'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 90000,
      env: {
        ...process.env,
        GD_TARGET: 'dashboard',
        NUXT_TELEMETRY_DISABLED: '1',
        SCHEMAS_PATH: join(root, 'schemas/source'),
      },
    })
    expect(build.error, build.stderr).toBeUndefined()
    expect(build.status, build.stdout + build.stderr).toBe(0)
  } finally {
    rmSync(workspace, { recursive: true, force: true })
  }
}, 180000)
