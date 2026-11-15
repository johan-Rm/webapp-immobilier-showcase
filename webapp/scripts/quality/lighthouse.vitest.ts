import { describe, expect, it } from 'vitest'

import { assessLighthouse, contentConfig, median } from './lighthouse'
const valid = () => ({
  lighthouseVersion: '13.0.1',
  finalUrl: 'http://127.0.0.1:19851/connexion',
  categories: Object.fromEntries(
    ['performance', 'accessibility', 'best-practices', 'seo'].map((k) => [k, { score: 0.5 }]),
  ),
  audits: {
    ...Object.fromEntries(
      [
        'first-contentful-paint',
        'largest-contentful-paint',
        'cumulative-layout-shift',
        'total-blocking-time',
        'speed-index',
      ].map((k) => [k, { numericValue: 1 }]),
    ),
    'quality-page-content': { score: 1 },
  },
})
describe('Lighthouse sans faux succès', () => {
  it('conserve les scores informatifs', () =>
    expect(assessLighthouse(valid(), 'http://127.0.0.1:19851/connexion').informativeScores).toBe(
      true,
    ))
  it.each(['CHROME_INTERSTITIAL_ERROR', 'NO_FCP', 'ERRORED_DOCUMENT_REQUEST'])(
    'refuse toute erreur runtime',
    (code) =>
      expect(() =>
        assessLighthouse(
          { ...valid(), runtimeError: { code } },
          'http://127.0.0.1:19851/connexion',
        ),
      ).toThrow(),
  )
  it.each([
    'chrome-error://chromewebdata',
    'http://127.0.0.1:19851/connexion?bad=1',
    'http://127.0.0.1:19851/',
  ])('refuse une mauvaise page finale', (finalUrl) =>
    expect(() =>
      assessLighthouse({ ...valid(), finalUrl }, 'http://127.0.0.1:19851/connexion'),
    ).toThrow(),
  )
  it('refuse catégories, mesures et contenu absents', () => {
    for (const patch of [
      { categories: {} },
      { audits: {} },
      { audits: { ...valid().audits, 'quality-page-content': { score: 0 } } },
    ])
      expect(() =>
        assessLighthouse({ ...valid(), ...patch }, 'http://127.0.0.1:19851/connexion'),
      ).toThrow()
  })
  it('calcule les médianes sans trier les observations originales', () => {
    const values = [9, 1, 3]
    expect(median(values)).toBe(3)
    expect(values).toEqual([9, 1, 3])
    expect(median([1, 3])).toBe(2)
    expect(() => median([])).toThrow()
  })
  it('échappe les textes de fixture dans la configuration exécutable', () =>
    expect(contentConfig('";throw Error("injection")//', {})).toContain(
      'text.includes("\\";throw Error(\\"injection\\")//")',
    ))
})

it('refuse une autre version de scanner', () =>
  expect(() =>
    assessLighthouse({ ...valid(), lighthouseVersion: '99' }, 'http://127.0.0.1:19851/connexion'),
  ).toThrow())
