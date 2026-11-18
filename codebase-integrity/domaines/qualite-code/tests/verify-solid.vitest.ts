import { createHash } from 'node:crypto'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { diagnosticLimit } from '../../../commun/console-context'
import { ROOT } from '../../../commun/validation-rules'
import {
  applyComposableExceptions,
  countComposableReturns,
  solidExitCode,
} from '../scripts/verify-solid'

const keys = 'a,b,c,d,e,f,g,h,i'
it('affiche tous les diagnostics peu nombreux et abrège les ensembles volumineux', () => {
  expect(diagnosticLimit(4)).toBe(4)
  expect(diagnosticLimit(8)).toBe(8)
  expect(diagnosticLimit(9)).toBe(3)
})

describe('taille réelle de l’interface des composables', () => {
  it('compte données et fonctions indépendamment du formatage', () => {
    expect(countComposableReturns(`export const useOffers = () => ({${keys}, load(){}})`)).toEqual([
      { name: 'useOffers', count: 10, complete: true },
    ])
  })
  it('compte les clés uniques et non les sous-propriétés', () => {
    expect(
      countComposableReturns(
        'export function useOffer(){return {a:{x:1,y:2}, load(){}, ["b"]:1, a:2}}',
      )[0].count,
    ).toBe(3)
  })
  it('résout un objet local et les spreads statiques', () => {
    expect(
      countComposableReturns(
        'const base = {a:1,b:2}; export function useOffer(){const api={...base, c:3};return api as const}',
      )[0],
    ).toEqual({ name: 'useOffer', count: 3, complete: true })
  })
  it('analyse chaque branche sans compter les retours des fonctions internes', () => {
    const results = countComposableReturns(
      `export function useOffer(){function helper(){return {${keys}}} if (ready) return {a:1}; return {${keys}}}`,
    )
    expect(results.map((r) => r.count)).toEqual([1, 9])
  })
  it('signale un retour dynamique et un spread inconnu', () => {
    expect(countComposableReturns('export const useOffer=()=> makeApi()')[0].complete).toBe(false)
    expect(countComposableReturns('export const useOffer=()=> ({...unknown,a:1})')[0]).toEqual({
      name: 'useOffer',
      count: 1,
      complete: false,
    })
  })
  it('ne prétend pas résoudre un objet modifié ou un paramètre masquant une constante', () => {
    expect(
      countComposableReturns(
        'export function useOffer(){const api={a:1}; delete api.a; return api}',
      )[0].complete,
    ).toBe(false)
    expect(
      countComposableReturns('const api={a:1};export function useOffer(api){return api}')[0]
        .complete,
    ).toBe(false)
  })
  it('ne prend pas une fonction utilitaire pour un composable', () => {
    expect(countComposableReturns(`export function helper(){return {${keys}}}`)).toEqual([])
  })
  it('ne masque pas une erreur de syntaxe', () => {
    expect(() => countComposableReturns('export function useOffer( {')).toThrow()
  })
  it('conserve les avertissements non bloquants et bloque les erreurs', () => {
    expect(
      solidExitCode([{ file: 'Large.vue', rule: 'app-large-component', message: '201 lignes' }]),
    ).toBe(0)
    expect(
      solidExitCode([
        {
          file: 'useOffer.ts',
          rule: 'app-composable-many-returns',
          message: '9 propriétés',
          severity: 'error',
        },
      ]),
    ).toBe(1)
  })
})

describe('exceptions temporaires SOLID', () => {
  const file = 'sites/demo/app/composables/useOffer.ts'
  const source = `export const useOffer = () => ({${keys}})`
  const exception = {
    file,
    composable: 'useOffer',
    sha256: createHash('sha256').update(source).digest('hex'),
    count: 9,
    demand: 'DEM-012',
    reason: 'Séparer les responsabilités.',
    expires: '2026-12-02',
  }
  const violation = {
    file: join(ROOT, file),
    rule: 'app-composable-many-returns',
    composable: 'useOffer',
    count: 9,
    complete: true,
    severity: 'error' as const,
    message: '9 propriétés',
  }
  const now = new Date('2026-11-18T12:00:00Z')
  const apply = (raw: unknown, content = source, date = now, findings = [violation]) =>
    applyComposableExceptions(findings, raw, () => content, date)

  it('exempte seulement l’écart exact et conserve la visibilité de la dette', () => {
    const findings = apply([exception])
    expect(findings[0].severity).toBe('exemption')
    expect(findings[0].message).toContain('DEM-012')
    expect(solidExitCode(findings)).toBe(0)
  })
  it('conserve tout autre dépassement bloquant', () => {
    const other = { ...violation, file: join(ROOT, 'other.ts') }
    const findings = apply([exception], source, now, [violation, other])
    expect(findings[1]).toEqual(other)
    expect(solidExitCode(findings)).toBe(1)
  })
  it('accepte le dernier jour UTC et bloque dès le lendemain', () => {
    expect(solidExitCode(apply([exception], source, new Date('2026-12-02T23:59:59.999Z')))).toBe(0)
    expect(solidExitCode(apply([exception], source, new Date('2026-12-03T00:00:00Z')))).toBe(1)
  })
  it('bloque toute modification du fichier même si le comptage est identique', () => {
    expect(solidExitCode(apply([exception], source + '\n'))).toBe(1)
  })
  it('bloque un fichier illisible ou absent', () => {
    const findings = applyComposableExceptions(
      [violation],
      [exception],
      () => {
        throw new Error('absent')
      },
      now,
    )
    expect(solidExitCode(findings)).toBe(1)
    expect(findings.some((v) => v.message.includes('absent'))).toBe(true)
  })
  it('exige le nom, le nombre et le comptage complet attendus', () => {
    for (const change of [{ composable: 'useOther' }, { count: 10 }, { complete: false }])
      expect(solidExitCode(apply([exception], source, now, [{ ...violation, ...change }]))).toBe(1)
  })
  it('refuse une exception orpheline ou ambiguë', () => {
    expect(solidExitCode(apply([exception], source, now, []))).toBe(1)
    expect(solidExitCode(apply([exception], source, now, [violation, violation]))).toBe(1)
  })
  it.each([
    null,
    {},
    [null],
    [exception, exception],
    [{ ...exception, file: '../useOffer.ts' }],
    [{ ...exception, sha256: 'bad' }],
    [{ ...exception, count: 8 }],
    [{ ...exception, reason: '' }],
    [{ ...exception, demand: '' }],
    [{ ...exception, expires: '2026-02-30' }],
    [{ ...exception, expires: '2026-12-02T00:00:00Z' }],
  ])('refuse une déclaration invalide %#', (raw) => {
    expect(solidExitCode(apply(raw))).toBe(1)
    expect(apply(raw).some((v) => v.message.includes('Exception SOLID refusée'))).toBe(true)
  })
  it('conserve les erreurs sans exception configurée', () => {
    expect(apply(undefined)).toEqual([violation])
    expect(solidExitCode(apply([]))).toBe(1)
  })
})
