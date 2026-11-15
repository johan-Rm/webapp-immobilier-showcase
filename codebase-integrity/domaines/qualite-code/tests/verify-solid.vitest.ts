import { describe, expect, it } from 'vitest'

import { diagnosticLimit } from '../../../commun/console-context'
import { countComposableReturns, solidExitCode } from '../scripts/verify-solid'

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
