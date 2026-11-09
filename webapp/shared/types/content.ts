import type { MediaObject } from '../../schemas/interfaces'

/**
 * Élément de navigation / lien éditorial (menu, raccourcis, liens de section).
 *
 * Type de contenu frontend : il provient de Nuxt Content (Markdown), pas de
 * l'API Symfony, et n'a donc pas sa place dans les contrats partagés de
 * l'orchestrateur. Importé directement depuis `#shared/types/content`.
 */
export type MenuItem = {
  identifier?: string
  name: string
  description?: string
  url: string
  imageIdentifier?: string
  label?: string
}

/**
 * Bloc de contenu Schema.org générique (sections de page, `hasPart`).
 *
 * Type de contenu frontend (composition éditoriale issue de Nuxt Content),
 * volontairement hors orchestrateur. Récursif via `hasPart`. Tous les champs
 * sont optionnels : chaque écran consomme un sous-ensemble.
 */
export type CreativeWork = {
  identifier?: string
  name?: string
  headline?: string
  alternativeHeadline?: string
  text?: string
  description?: string
  url?: string
  additionalType?: string
  image?: MediaObject | string | MediaObject[]
  links?: MenuItem[]
  hasPart?: CreativeWork[]
}

export type ResourceKey =
  | 'app'
  | 'web-pages'
  | 'articles'
  | 'travels'
  | 'category-code'
  | 'media-object'
  | 'accommodations'
  | 'forms/accommodation'
  | 'dashboard'
  | 'ui/accommodation'
