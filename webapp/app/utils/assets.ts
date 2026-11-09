import { joinURL } from 'ufo'

/**
 * Résout l'URL d'un asset statique en préfixant automatiquement le `baseURL` de l'application.
 *
 * Le préfixe est lu depuis `runtimeConfig.app.baseURL` afin de supporter les déploiements
 * sur sous-chemin (ex: `/my-app/`). Retombe sur `/` si la valeur est absente.
 *
 * @param path Chemin de l'asset (ex: `favicon.svg`, `themes.css`).
 * @returns URL résolue prête à être utilisée dans un attribut `href` ou `src`.
 *
 * @example
 * assetUrl('favicon.svg') // → '/favicon.svg' ou '/my-app/favicon.svg'
 */
export const assetUrl = (path: string): string => {
  const base = useRuntimeConfig().app.baseURL || '/'
  return joinURL(base, path)
}
