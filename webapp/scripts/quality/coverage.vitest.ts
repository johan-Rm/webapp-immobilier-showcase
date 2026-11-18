import { describe, expect, it } from 'vitest'

import { summarizeCoverage } from './coverage'

describe('bilan de couverture', () => {
  it('distingue les sources exécutées, non couvertes et non mesurables', () => {
    const result = summarizeCoverage(
      ['webapp/shared/a.ts', 'webapp/shared/b.ts', 'webapp/shared/c.vue'],
      [
        {
          a: { path: '/tmp/app/shared/a.ts', s: { 0: 1, 1: 0 } },
          b: { path: '/tmp/app/shared/b.ts', s: { 0: 0 } },
        },
      ],
      '/tmp/app',
    )
    expect(result.map((item) => item.status)).toEqual(['mesuré', 'non-couvert', 'non-mesurable'])
  })
  it('refuse les mesures non numériques', () => {
    expect(() =>
      summarizeCoverage(
        ['webapp/a.ts'],
        [{ a: { path: '/tmp/app/a.ts', s: { 0: Number.NaN } } }],
        '/tmp/app',
      ),
    ).toThrow('Couverture invalide')
  })
  it('réunit les exécutions sans compter deux fois une instruction', () => {
    const file = { path: '/tmp/app/a.ts', s: { 0: 0, 1: 1 } }
    const result = summarizeCoverage(
      ['webapp/a.ts'],
      [{ a: file }, { a: { ...file, s: { 0: 1, 1: 0 } } }],
      '/tmp/app',
    )
    expect(result[0]).toMatchObject({ statements: 2, executed: 2 })
  })
})
