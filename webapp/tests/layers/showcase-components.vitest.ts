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
import { join, resolve } from 'node:path'

import { expect, it } from 'vitest'

it('conserve les noms publics des 16 screens et la priorité de la surcharge cliente', () => {
  const webapp = resolve(import.meta.dirname, '../..')
  const root = mkdtempSync(join(tmpdir(), 'showcase-screens-'))
  try {
    symlinkSync(join(webapp, 'node_modules'), join(root, 'node_modules'), 'dir')
    cpSync(join(webapp, 'base/real-estate'), join(root, 'base/real-estate'), { recursive: true })
    mkdirSync(join(root, 'sites/showcase/app/components/screen'), { recursive: true })
    writeFileSync(join(root, 'package.json'), '{"type":"module"}')
    writeFileSync(
      join(root, 'nuxt.config.ts'),
      "import { resolve } from 'node:path'; export default defineNuxtConfig({srcDir: resolve(__dirname, 'sites/showcase/app'), extends: ['./sites/showcase'], compatibilityDate: '2025-07-15'})",
    )
    writeFileSync(
      join(root, 'sites/showcase/nuxt.config.ts'),
      "export default defineNuxtConfig({srcDir: './app', extends: ['../../base/real-estate']})",
    )
    const prepare = () => {
      const result = spawnSync('node', [join(root, 'node_modules/nuxt/bin/nuxt.mjs'), 'prepare'], {
        cwd: root,
        encoding: 'utf8',
        timeout: 60000,
        env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' },
      })
      expect(result.status, result.stdout + result.stderr).toBe(0)
      return readFileSync(join(root, '.nuxt/components.d.ts'), 'utf8')
    }
    const components = prepare()
    const names = [
      'Blockquote',
      'Contact',
      'EssaouiraTheJewel',
      'Footer',
      'Footer2',
      'Investing',
      'PanelMDC',
      'PanelScrollDualSynced',
      'PropertyDetail',
      'PropertyExceptional',
      'PropertyList',
      'WhyChooseShowcase',
      'RealEstateFullImage',
      'RealEstateRounded',
      'RealEstateSplit',
      'RealEstateThreeColProperties',
    ]
    for (const name of names) {
      expect(components).toContain(`export const Screen${name}:`)
      expect(components).toContain(`export const LazyScreen${name}:`)
    }
    writeFileSync(
      join(root, 'sites/showcase/app/components/screen/Contact.vue'),
      '<template><p>Surcharge</p></template>',
    )
    const overridden = prepare()
    const contact = overridden
      .split('\n')
      .find((line) => line.startsWith('export const ScreenContact:'))
    expect(contact).toContain('sites/showcase/app/components/screen/Contact.vue')
    expect(contact).not.toContain('base/real-estate')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}, 120000)
