import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

const roots: string[] = []
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })))
const script = resolve(import.meta.dirname, '../scripts/verify-frontend-conventions.ts')
const fixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'frontend-policy-'))
  roots.push(root)
  execFileSync('git', ['init', '-q', root])
  const file = (name: string, text: string) => {
    const path = join(root, 'webapp', name)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, text)
  }
  const run = () =>
    spawnSync('bun', [script], {
      encoding: 'utf8',
      env: {
        ...process.env,
        AIDE_WEBAPP_ROOT: join(root, 'webapp'),
        AIDE_GIT_ROOT: root,
        GD_TARGET: 'client-b',
      },
    })
  const report = () =>
    JSON.parse(readFileSync(join(root, 'webapp/.tmp/quality/frontend-conventions.json'), 'utf8'))
  return { root, file, run, report }
}

describe('commande frontend réelle sur inventaire Git jetable', () => {
  it('ne bloque pas sur un warning et découvre aussi le client inactif', () => {
    const { file, run, report } = fixture()
    file(
      'nuxt.config.ts',
      'const target = resolveApplicationTarget(); export default defineNuxtConfig({srcDir: target.root})',
    )
    file(
      'sites/client-a/app/components/Offer.vue',
      '<template><div data-component="offer">Offres</div></template>',
    )
    file(
      'sites/client-b/app/components/Offer.vue',
      '<template><div data-component="offer" /></template>',
    )
    const result = run()
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(0)
    expect(report().files).toBe(3)
    expect(report().findings).toContainEqual(
      expect.objectContaining({
        severity: 'warning',
        file: 'sites/client-a/app/components/Offer.vue',
      }),
    )
    expect(result.stdout).toContain('Rapport complet')
    expect(result.stdout).toContain('[1/3] EN COURS')
    expect(result.stdout).toContain('Sources analysées :')
    expect(result.stdout).toContain('Branche des sources :')
    expect(result.stdout).toContain('autres worktrees ne sont pas intégrées')
    expect(result.stdout).toContain('Résultat : RÉUSSI')
    expect(result.stdout).not.toContain('\x1b[')
  }, 15_000)
  it('affiche toutes les erreurs lorsqu’il y en a quatre', () => {
    const { file, run, report } = fixture()
    file(
      'nuxt.config.ts',
      'const target = resolveApplicationTarget(); export default defineNuxtConfig({srcDir: target.root})',
    )
    for (const name of ['First', 'Second', 'Third', 'Fourth'])
      file(`sites/client-a/app/components/${name}.vue`, '<template><div /></template>')
    const result = run()
    expect(result.status).toBe(1)
    expect(
      report().findings.filter((entry: { severity: string }) => entry.severity === 'error'),
    ).toHaveLength(4)
    expect(result.stdout).toContain('Fourth.vue:')
    expect(result.stdout).toContain('Erreurs à corriger :')
  })
  it('renvoie un échec sur une violation et sur un inventaire incomplet', () => {
    const { file, run, report } = fixture()
    file('sites/client-a/app/components/Offer.vue', '<template><div /></template>')
    expect(run().status).toBe(1)
    file(
      'nuxt.config.ts',
      'const target = resolveApplicationTarget(); export default defineNuxtConfig({srcDir: target.root})',
    )
    const result = run()
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('Résultat : ÉCHEC')
    expect(report().findings).toContainEqual(
      expect.objectContaining({ severity: 'error', rule: 'root-marker' }),
    )
  })
})
