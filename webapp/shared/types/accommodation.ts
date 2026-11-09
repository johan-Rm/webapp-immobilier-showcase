export type PropertyItem = {
  categorySlug: string
  city: string
  title: string
  price: string
  meta: string
  tags: string[]
  image: string
  href: string
  numberOfBedrooms?: number
  floorSize?: string
  identifier?: string
  place?: string
}

export type ViewModeList = 'single' | 'quad' | 'row4'

/** Devise par défaut et unique pour les offres de biens (dirham marocain). */
export const DEFAULT_PRICE_CURRENCY = 'MAD'
