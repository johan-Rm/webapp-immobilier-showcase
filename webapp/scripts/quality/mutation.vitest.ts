import { describe, expect, it } from 'vitest'

import { assessMutation, runOwned } from './mutation'
describe('mesure de mutation', () => {
  it('distingue les résultats sans budget de score implicite', () =>
    expect(
      assessMutation({
        files: {
          sample: {
            mutants: ['Killed', 'Timeout', 'Survived', 'NoCoverage', 'Ignored'].map((status) => ({
              status,
            })),
          },
        },
      }),
    ).toEqual({
      detected: 2,
      survived: 1,
      uncovered: 1,
      total: 4,
      excluded: 1,
      score: 50,
      informativeScore: true,
    }))
  it.each([
    null,
    {},
    { files: {} },
    { files: { sample: { mutants: [] } } },
    { files: { sample: { mutants: [{ status: 'Pending' }] } } },
    { files: { sample: { mutants: [{ status: 'RuntimeError' }, { status: 'Killed' }] } } },
  ])('refuse les rapports incomplets ou erronés', (value) =>
    expect(() => assessMutation(value)).toThrow(),
  )
  it('refuse des tests initiaux échoués', async () => {
    await expect(runOwned('node', ['-e', 'process.exit(2)'], process.cwd(), 1000)).rejects.toThrow()
  })
  it('arrête son processus au dépassement du délai', async () => {
    await expect(
      runOwned('node', ['-e', 'setInterval(()=>{},1000)'], process.cwd(), 100),
    ).rejects.toThrow()
  })
})
