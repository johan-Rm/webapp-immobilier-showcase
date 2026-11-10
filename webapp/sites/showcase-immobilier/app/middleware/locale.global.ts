import { isLocaleCode } from '#shared/utils/locale'

/**
 * Extrait une locale valide depuis le path.
 *
 * Objectif : centraliser l’analyse du préfixe `/fr`, `/en`, etc. pour éviter
 * des redirections inutiles et garder la logique au même endroit.
 *
 * @param path Chemin de la route à inspecter.
 * @returns La locale si détectée et valide, sinon `null`.
 */
const getLocaleFromPath = (path: string): string | null => {
  const match = path.match(/^\/([a-z]{2})(?:\/|$)/i)
  const code = match?.[1]?.toLowerCase() ?? ''
  return isLocaleCode(code) ? code : null
}

const isApiPath = (path: string): boolean => {
  return path === '/api' || path.startsWith('/api/')
}

const isServerAuthPath = (path: string): boolean => {
  return path === '/auth' || path.startsWith('/auth/')
}

const getLocaleFromCookie = (): string | null => {
  const redirectedLocale = useCookie<string | null>('i18n_redirected').value
  return isLocaleCode(redirectedLocale ?? undefined) ? redirectedLocale : null
}

/**
 * Middleware global de normalisation de locale.
 *
 * But :
 * - garantir une URL préfixée par une locale (`/fr/...`)
 * - éviter que `useLang()` déclenche des side-effects dans toute l’app
 *
 * @example
 * /contact -> /fr/contact
 */
export default defineNuxtRouteMiddleware((to) => {
  if (isApiPath(to.path)) return
  if (isServerAuthPath(to.path)) return

  const { isEnabledLocale, sourceLocale } = useProjectLocales()

  const pathLocale = getLocaleFromPath(to.path)
  const paramLocale =
    typeof to.params?.locale === 'string' && isLocaleCode(to.params.locale)
      ? to.params.locale
      : null

  // Locale présente dans l’URL mais non activée pour ce projet : on redirige
  // vers la locale source en retirant le préfixe `/xx`.
  if (pathLocale && !isEnabledLocale(pathLocale)) {
    const rest = to.path.slice(3)
    return navigateTo({
      path: `/${sourceLocale.value}${rest}`,
      query: to.query,
      hash: to.hash,
    })
  }

  // Si la route porte déjà une locale activée (path ou param), on n’intervient pas.
  if (pathLocale || paramLocale) return

  const cookieLocale = getLocaleFromCookie()
  const locale = cookieLocale && isEnabledLocale(cookieLocale) ? cookieLocale : sourceLocale.value

  // Redirection vers la version localisée pour stabiliser le routing et l’init.
  return navigateTo({
    path: `/${locale}${to.path === '/' ? '' : to.path}`,
    query: to.query,
    hash: to.hash,
  })
})
