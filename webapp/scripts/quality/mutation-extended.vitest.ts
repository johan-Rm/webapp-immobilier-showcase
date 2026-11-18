import { describe, expect, it } from 'vitest'

import { mutationFiles, mutationSelection, mutationTempRoot } from './mutation-extended'

describe('périmètre de mutation', () => {
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
