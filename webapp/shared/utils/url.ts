/**
 * Supprime le slash final d'un chemin de route pour permettre des comparaisons homogènes.
 * Protège contre les variations d'URL trailing slash sans altérer la racine `/`.
 */
export const normalizeRoutePath = (value: string): string =>
  value !== '/' ? value.replace(/\/+$/, '') : '/'

const normalizeSiteUrl = (value: string): string => value.replace(/\/+$/, '')

const normalizePath = (value: string): string => {
  if (!value) return '/'
  const [pathname] = value.split(/[?#]/, 1)
  const normalized = pathname?.startsWith('/') ? pathname : `/${pathname ?? ''}`
  return normalized.replace(/\/{2,}/g, '/') || '/'
}

/**
 * Résout une URL absolue à partir d'une base de site et d'un chemin relatif.
 */
export const toAbsoluteUrl = (siteUrl: string, pathOrUrl?: string | null): string | undefined => {
  if (!pathOrUrl) return undefined
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${normalizeSiteUrl(siteUrl)}${normalizePath(pathOrUrl)}`
}
