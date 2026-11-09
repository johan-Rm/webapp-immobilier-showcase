import type { ResourceKey } from '#shared/types/content'

/**
 * Registre des cles de ressources de contenu valides (Nuxt Content).
 *
 * Source de verite unique pour la validation des ressources, notamment cote serveur.
 * Framework-agnostic.
 */
export const CONTENT_RESOURCES = [
  'app',
  'web-pages',
  'articles',
  'travels',
  'category-code',
  'media-object',
  'accommodations',
  'forms/accommodation',
  'dashboard',
  'ui/accommodation',
] as const satisfies readonly ResourceKey[]

export const isResourceKey = (value: string): value is ResourceKey =>
  CONTENT_RESOURCES.includes(value as ResourceKey)
