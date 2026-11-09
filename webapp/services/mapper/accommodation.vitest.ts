import type { Accommodation } from '@schemas/interfaces'

import { describe, expect, it } from 'vitest'

import { mapAccommodation } from '@services/mapper/accommodation'

/**
 * Couvre la résolution des médias d'écran (`hasPart`) introduite pour le modèle
 * « les écrans sélectionnent dans la galerie `associatedMedia` du bien » (032) :
 * une entrée d'écran référence en priorité un identifiant de la galerie du bien,
 * sinon un identifiant global, sinon une url directe (contenu legacy).
 */

const baseAccommodation = (overrides: Record<string, unknown>): Accommodation =>
  ({
    identifier: 'TEST001',
    slug: 'bien-test',
    name: 'Bien test',
    category: 'villa-golf',
    realEstateListing: 'bien-a-vendre',
    place: 'essaouira',
    offer: { price: '1', priceCurrency: 'MAD' },
    metaTitle: 'Bien test',
    metaDescription: '',
    isActive: true,
    ...overrides,
  }) as unknown as Accommodation

const firstScreenMedia = (result: Accommodation) => {
  const part = (result.hasPart ?? [])[0] as unknown as {
    associatedMedia: { url: string; caption: string }[]
  }
  return part.associatedMedia[0]
}

describe('mapAccommodation — médias d’écran', () => {
  it('résout une référence d’écran via la galerie associatedMedia du bien (image + url)', () => {
    const result = mapAccommodation(
      baseAccommodation({
        associatedMedia: [
          {
            image: 'bien-test-salon-01',
            url: '/poc/bien-test/bien-test-salon-01.jpg',
            caption: 'Salon lumineux',
          },
        ],
        hasPart: [
          {
            additionalType: 'SCREEN_ACCOMMODATION_FULL',
            position: 1,
            associatedMedia: [{ image: 'bien-test-salon-01' }],
          },
        ],
      }),
    )

    const media = firstScreenMedia(result)
    expect(media.url).toBe('/poc/bien-test/bien-test-salon-01.jpg')
    expect(media.caption).toBe('Salon lumineux')
  })

  it('résout une référence d’écran sous forme d’identifiant brut (liste plate, modèle API uuid[])', () => {
    const result = mapAccommodation(
      baseAccommodation({
        associatedMedia: [
          {
            image: 'bien-test-salon-01',
            url: '/poc/bien-test/bien-test-salon-01.jpg',
            caption: 'Salon lumineux',
          },
        ],
        hasPart: [
          {
            additionalType: 'SCREEN_ACCOMMODATION_FULL',
            position: 1,
            associatedMedia: ['bien-test-salon-01'],
          },
        ],
      }),
    )

    const media = firstScreenMedia(result)
    expect(media.url).toBe('/poc/bien-test/bien-test-salon-01.jpg')
    expect(media.caption).toBe('Salon lumineux')
  })

  it('reste rétro-compatible avec une url directe portée par l’écran (contenu legacy)', () => {
    const result = mapAccommodation(
      baseAccommodation({
        associatedMedia: [],
        hasPart: [
          {
            additionalType: 'SCREEN_ACCOMMODATION_FULL',
            position: 1,
            associatedMedia: [{ url: '/poc/bien-test/legacy-01.jpg', caption: 'Legacy' }],
          },
        ],
      }),
    )

    expect(firstScreenMedia(result).url).toBe('/poc/bien-test/legacy-01.jpg')
  })

  it('résout une référence via l’index global des médias quand absente de la galerie', () => {
    const result = mapAccommodation(
      baseAccommodation({
        associatedMedia: [],
        hasPart: [
          {
            additionalType: 'SCREEN_ACCOMMODATION_FULL',
            position: 1,
            associatedMedia: [{ image: 'global-media-01' }],
          },
        ],
      }),
      {
        images: [
          {
            identifier: 'global-media-01',
            url: '/images/global-media-01.jpg',
            caption: 'Média global',
            mainEntity: 'ImageObject',
          },
        ],
      },
    )

    expect(firstScreenMedia(result).url).toBe('/images/global-media-01.jpg')
  })
})
