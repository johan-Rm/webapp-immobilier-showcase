import { describe, expect, it } from 'vitest'

import {
  assessInstrumentation,
  escapeMutationPath,
  mutationFiles,
  mutationSelection,
  mutationSnapshotPaths,
  mutationTempRoot,
} from './mutation-extended'
import { mutationTestFiles } from './mutation-test-selection'

describe('périmètre de mutation', () => {
  it('inclut le sélecteur des tests dans la copie jetable même avant son commit', () => {
    expect(mutationSnapshotPaths([], { source: [], comparison: [], excluded: [] })).toEqual([
      'webapp/scripts/quality/mutation-test-selection.ts',
    ])
  })
  it('exclut les tests des outils tout en conservant les tests applicatifs', () => {
    const files = [
      'scripts/quality/tool.vitest.ts',
      'shared/a.vitest.ts',
      'server/tests/b.vitest.ts',
    ]
    expect(mutationTestFiles('/unused', 'dashboard', files)).toEqual([
      'shared/a.vitest.ts',
      'server/tests/b.vitest.ts',
    ])
  })
  it('protège les crochets des chemins de routes dans les motifs Stryker', () => {
    expect(escapeMutationPath('server/api/[id].ts')).toBe('server/api/[[]id[]].ts')
  })
  it('distingue code valide non analysable par Stryker et erreur syntaxique', () => {
    expect(assessInstrumentation('a.ts', 'export type { Missing }')).toMatch(/Stryker/)
    expect(assessInstrumentation('a.ts', 'export const value = 1')).toBeUndefined()
    expect(() => assessInstrumentation('a.ts', 'const x = ;')).toThrow('Source invalide')
  })
  it('évite une copie temporaire imbriquée dans l’application', () => {
    expect(mutationTempRoot('/workspace/webapp', '/workspace/webapp/.tmp')).toBe('/tmp')
    expect(mutationTempRoot('/workspace/webapp', '/var/tmp')).toBe('/var/tmp')
  })
  it('sélectionne les sources exécutables et signale Vue', () => {
    const result = mutationSelection(['webapp/shared/a.ts', 'webapp/dashboard/a.vue'])
    expect(result.selected).toEqual(['webapp/shared/a.ts'])
    expect(result.notSelected).toEqual([
      { path: 'webapp/dashboard/a.vue', reason: 'Mutation Vue non validée' },
    ])
  })
  it('refuse les fichiers hors périmètre et la sélection vide', () => {
    expect(() => mutationSelection(['webapp/a.ts'], ['webapp/b.ts'])).toThrow()
    expect(() => mutationSelection(['webapp/a.vue'])).toThrow()
  })
  it('distingue les fichiers absents du rapport', () => {
    expect(
      mutationFiles(['webapp/a.ts', 'webapp/b.ts'], {
        files: { '/tmp/webapp/a.ts': { mutants: [{ status: 'Killed' }] } },
      }).map((item) => item.status),
    ).toEqual(['mesuré', 'non-mesurable'])
  })
  it('signale les mutants sans couverture et les fichiers sans mutant évaluable', () => {
    const files = {
      'a.ts': { mutants: [{ status: 'NoCoverage' }] },
      'b.ts': { mutants: [{ status: 'CompileError' }] },
    }
    expect(
      mutationFiles(['webapp/a.ts', 'webapp/b.ts'], { files }).map((item) => item.status),
    ).toEqual(['sans-couverture', 'non-mesurable'])
  })
})
