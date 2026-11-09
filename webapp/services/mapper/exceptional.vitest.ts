import type { Accommodation } from '@schemas/interfaces'

import { describe, expect, it } from 'vitest'

import {
  deriveExceptionalBadges,
  deriveExceptionalScreens,
  formatExceptionalPrice,
  isExceptionalProperty,
  resolveExceptionalLayout,
} from './exceptional'

import { DASHBOARD_CONTACT_SCREEN } from '#shared/types/dashboardAccommodation'

// hasPart est content-driven (faiblement typé) : on construit des fixtures
// partielles castées vers Accommodation, comme à la lecture réelle du store.
const buildAccommodation = (overrides: Record<string, unknown>): Accommodation =>
  overrides as unknown as Accommodation

const part = (overrides: Record<string, unknown>): Record<string, unknown> => ({
  associatedMedia: [{ url: '/img/a.jpg', caption: 'Visuel A' }],
  ...overrides,
})

describe('deriveExceptionalScreens', () => {
  it('trie les écrans par position croissante', () => {
    const item = buildAccommodation({
      hasPart: [
        part({ additionalType: 'SCREEN_ACCOMMODATION_SPLIT', position: 2, name: 'Entrée' }),
        part({ additionalType: 'SCREEN_ACCOMMODATION_FULL', position: 1, name: 'Vue' }),
      ],
    })

    const screens = deriveExceptionalScreens(item)

    // Le dernier écran est le contact figé, ajouté hors hasPart.
    expect(screens.slice(0, -1).map((screen) => screen.eyebrow)).toEqual(['Vue', 'Entrée'])
  })

  it('ajoute l’écran de contact figé en clôture du parcours', () => {
    const item = buildAccommodation({
      hasPart: [part({ additionalType: 'SCREEN_ACCOMMODATION_FULL', position: 1, name: 'Vue' })],
    })

    const screens = deriveExceptionalScreens(item)
    const last = screens.at(-1)

    expect(last?.template).toBe('CONTACT')
    expect(last?.id).toBe('contact')
    expect(last?.eyebrow).toBe(DASHBOARD_CONTACT_SCREEN.name)
    expect(last?.media).toEqual([])
  })

  it('mappe additionalType vers le bon template', () => {
    const item = buildAccommodation({
      hasPart: [part({ additionalType: 'SCREEN_ACCOMMODATION_TRYPTIQUE', position: 1, name: 'X' })],
    })

    expect(deriveExceptionalScreens(item)[0]?.template).toBe('SCREEN_01')
    expect(resolveExceptionalLayout('SCREEN_01')).toBe('triptych')
  })

  it('retombe sur SCREEN_03 pour un additionalType inconnu', () => {
    const item = buildAccommodation({
      hasPart: [part({ additionalType: 'SCREEN_ACCOMMODATION_UNKNOWN', position: 1, name: 'X' })],
    })

    expect(deriveExceptionalScreens(item)[0]?.template).toBe('SCREEN_03')
  })

  it('extrait le mot accentué de headline (**...**) en titleHighlight', () => {
    const item = buildAccommodation({
      hasPart: [
        part({
          additionalType: 'SCREEN_ACCOMMODATION_FULL',
          position: 1,
          name: 'Vue',
          headline: 'Une oasis **au cœur du golf**',
        }),
      ],
    })

    const screen = deriveExceptionalScreens(item)[0]
    expect(screen?.title).toBe('Une oasis au cœur du golf')
    expect(screen?.titleHighlight).toBe('au cœur du golf')
  })

  it('lit reverse et overlayMode depuis meta', () => {
    const item = buildAccommodation({
      hasPart: [
        part({
          additionalType: 'SCREEN_ACCOMMODATION_OVERLAY',
          position: 1,
          name: 'Cuisine',
          meta: { reverse: true, overlayMode: 'light' },
        }),
      ],
    })

    const screen = deriveExceptionalScreens(item)[0]
    expect(screen?.reverse).toBe(true)
    expect(screen?.overlayMode).toBe('light')
  })

  it('lit imageOverlay depuis meta pour le split', () => {
    const item = buildAccommodation({
      hasPart: [
        part({
          additionalType: 'SCREEN_ACCOMMODATION_SPLIT',
          position: 1,
          name: 'Entrée',
          meta: { imageOverlay: 'light' },
        }),
      ],
    })

    expect(deriveExceptionalScreens(item)[0]?.imageOverlay).toBe('light')
  })

  it.each([undefined, '', 'invalid'])('utilise dark quand imageOverlay vaut %s', (imageOverlay) => {
    const item = buildAccommodation({
      hasPart: [
        part({
          additionalType: 'SCREEN_ACCOMMODATION_FULL',
          position: 1,
          name: 'Vue',
          meta: { imageOverlay },
        }),
      ],
    })

    expect(deriveExceptionalScreens(item)[0]?.imageOverlay).toBe('dark')
  })

  it('mappe les médias url/caption en src/alt', () => {
    const item = buildAccommodation({
      hasPart: [
        part({
          additionalType: 'SCREEN_ACCOMMODATION_FULL',
          position: 1,
          name: 'Vue',
          associatedMedia: [{ url: '/img/x.jpg', caption: 'Légende' }],
        }),
      ],
    })

    expect(deriveExceptionalScreens(item)[0]?.media[0]).toEqual({
      src: '/img/x.jpg',
      alt: 'Légende',
    })
  })
})

describe('isExceptionalProperty', () => {
  it('est vrai avec au moins un écran d’espace reconnu et un média', () => {
    const item = buildAccommodation({
      hasPart: [part({ additionalType: 'SCREEN_ACCOMMODATION_FULL', position: 1, name: 'Vue' })],
    })

    expect(isExceptionalProperty(item)).toBe(true)
  })

  it('est faux sans hasPart', () => {
    expect(isExceptionalProperty(buildAccommodation({}))).toBe(false)
  })

  it('est faux si les écrans n’ont aucun média', () => {
    const item = buildAccommodation({
      hasPart: [{ additionalType: 'SCREEN_ACCOMMODATION_FULL', position: 1, associatedMedia: [] }],
    })

    expect(isExceptionalProperty(item)).toBe(false)
  })

  it('est faux pour un additionalType inconnu sans média', () => {
    const item = buildAccommodation({
      hasPart: [{ additionalType: 'SCREEN_ACCOMMODATION_UNKNOWN', position: 1 }],
    })

    expect(isExceptionalProperty(item)).toBe(false)
  })
})

describe('deriveExceptionalBadges', () => {
  it('formate surface, pièces, chambres et salles de bains', () => {
    const item = buildAccommodation({
      floorSize: 180,
      numberOfRooms: 5,
      numberOfBedrooms: 3,
      numberOfBathroomsTotal: 2,
    })

    expect(deriveExceptionalBadges(item)).toEqual([
      { full: '180 m²', short: '180 m²' },
      { full: '5 pièces', short: '5 p.' },
      { full: '3 chambres', short: '3 ch.' },
      { full: '2 salles de bains', short: '2 sdb' },
    ])
  })

  it('omet les métriques absentes', () => {
    expect(deriveExceptionalBadges(buildAccommodation({ numberOfRooms: 4 }))).toEqual([
      { full: '4 pièces', short: '4 p.' },
    ])
  })
})

describe('formatExceptionalPrice', () => {
  it('formate un prix numérique en DH', () => {
    expect(formatExceptionalPrice(buildAccommodation({ offer: { price: 2500000 } }))).toContain(
      'DH',
    )
  })

  it('retombe sur priceSpecification puis tiret', () => {
    expect(
      formatExceptionalPrice(buildAccommodation({ offer: { priceSpecification: 'Sur demande' } })),
    ).toBe('Sur demande')
    expect(formatExceptionalPrice(buildAccommodation({ offer: {} }))).toBe('—')
  })
})
