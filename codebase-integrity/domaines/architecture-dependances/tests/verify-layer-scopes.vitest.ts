import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { isFrontendFile, isImageWrapper } from '../../../commun/validation-rules'
import { resolveImportPath } from '../scripts/verify-types-placement'

const temporary: string[] = []
afterEach(() =>
  temporary.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })),
)

const project = () => {
  const root = mkdtempSync(join(tmpdir(), 'layer-scopes-'))
  temporary.push(root)
  execFileSync('git', ['init', '-q', root])
  const app = join(root, 'webapp')
  const file = (path: string, text: string) => {
    const absolute = join(app, path)
    mkdirSync(dirname(absolute), { recursive: true })
    writeFileSync(absolute, text)
    return absolute
  }
  return { root, app, file }
}

describe('couverture frontend indépendante de la cible active', () => {
  it('conserve les scopes avant et après déplacement, sans élargir aux services', () => {
    const root = '/fixture/webapp'
    for (const path of [
      'app/',
      'dashboard/app/',
      'sites/showcase-immobilier/app/',
      'sites/client2-immobilier/app/',
      'base/real-estate/',
    ]) {
      expect(
        isFrontendFile(join(root, path, 'components/screen/Hero.vue'), ['components'], root),
      ).toBe(true)
      expect(isFrontendFile(join(root, path, 'pages/index.vue'), ['layouts'], root)).toBe(false)
    }
    for (const path of [
      'services/probe.ts',
      'sites/client2-immobilier/server/probe.ts',
      'base/other/components/Probe.vue',
    ]) {
      expect(isFrontendFile(join(root, path), [], root)).toBe(false)
    }
  })

  it('limite précisément l’exception au wrapper à la racine des applications', () => {
    for (const path of [
      'app/components/AppImage.vue',
      'dashboard/app/components/AppImage.vue',
      'sites/client2-immobilier/app/components/AppImage.vue',
    ]) {
      expect(isImageWrapper(join('/fixture', path), '/fixture')).toBe(true)
    }
    for (const path of [
      'app/pages/AppImage.vue',
      'dashboard/app/components/fake/AppImage.vue',
      'app/components/fake/AppImage.vue',
      'base/real-estate/components/AppImage.vue',
    ]) {
      expect(isImageWrapper(join('/fixture', path), '/fixture')).toBe(false)
    }
  })

  it('résout ~ et @ dans le client du fichier, y compris un client inactif', () => {
    const { app, file } = project()
    for (const client of ['showcase-immobilier', 'client2-immobilier']) {
      const definition = file(
        `sites/${client}/app/utils/contract.ts`,
        'export type Contract = string',
      )
      const consumer = file(`sites/${client}/app/components/Probe.vue`, '')
      expect(resolveImportPath('~/utils/contract', consumer, app)).toBe(definition)
      expect(resolveImportPath('@/utils/contract', consumer, app)).toBe(definition)
      expect(resolveImportPath('@utils/contract', consumer, app)).toBe(definition)
    }
  })

  it('résout les alias Dashboard sans viser Showcase', () => {
    const { app, file } = project()
    const definition = file('dashboard/app/utils/contract.ts', 'export type Contract = string')
    const consumer = file('dashboard/app/components/Probe.vue', '')
    for (const alias of ['~/utils/contract', '@/utils/contract', '@utils/contract'])
      expect(resolveImportPath(alias, consumer, app)).toBe(definition)
  })

  it('résout les alias du catalogue dans son unique application consommatrice', () => {
    const { app, file } = project()
    const definition = file(
      'sites/showcase-immobilier/app/stores/contract.ts',
      'export type Contract = string',
    )
    const consumer = file('base/real-estate/components/screen/Probe.vue', '')
    expect(resolveImportPath('~/stores/contract', consumer, app)).toBe(definition)
  })

  it('détecte réellement les images et sections dans les trois racines via Git', () => {
    const { root, app, file } = project()
    const paths = [
      'app/components/Probe.vue',
      'dashboard/app/components/Probe.vue',
      'sites/showcase-immobilier/app/pages/Probe.vue',
      'sites/client2-immobilier/app/components/Probe.vue',
      'base/real-estate/components/screen/Probe.vue',
    ]
    for (const path of paths)
      file(
        path,
        '<template><img src="/probe.jpg"></template>\n<script setup lang="ts">const probe = 1</script>',
      )
    file('sites/client2-immobilier/app/components/AppImage.vue', '<template><NuxtImg /></template>')
    const integrity = resolve(import.meta.dirname, '../../..')
    for (const script of [
      'interface-internationalisation/scripts/verify-app-image.ts',
      'qualite-code/scripts/verify-script-setup-standard.ts',
    ]) {
      const result = spawnSync('bun', [join(integrity, 'domaines', script)], {
        encoding: 'utf8',
        env: {
          ...process.env,
          AIDE_GIT_ROOT: root,
          AIDE_WEBAPP_ROOT: app,
          GD_TARGET: 'showcase-immobilier',
        },
      })
      expect(result.error).toBeUndefined()
      expect(result.status).toBe(1)
      for (const path of paths) expect(result.stderr).toContain(path)
      expect(result.stderr).not.toContain('components/AppImage.vue:')
    }
  })
})
