import type { LocaleCode, LocaleInfo } from '#shared/types/i18n'

/**
 * Registre des locales supportees par l'application.
 *
 * Source de verite unique : consommee par le module `@nuxtjs/i18n` (nuxt.config),
 * l'app, le serveur et les helpers partages. Framework-agnostic.
 */
export const AVAILABLES_LOCALES = {
  fr: { code: 'fr', iso: 'fr-FR', name: 'Français', dir: 'ltr', flag: '🇫🇷' },
  en: { code: 'en', iso: 'en-US', name: 'English', dir: 'ltr', flag: '🇺🇸' },
  es: { code: 'es', iso: 'es-ES', name: 'Español', dir: 'ltr', flag: '🇪🇸' },
} as const satisfies Record<LocaleCode, LocaleInfo>

export const FALLBACK_LOCALE: LocaleCode = 'fr'

/** Catalogue complet des locales supportees par l'app (ordre stable). */
export const SUPPORTED_LOCALES = Object.keys(AVAILABLES_LOCALES) as LocaleCode[]

export const isLocaleCode = (code: string | undefined): code is LocaleCode =>
  Boolean(code && code in AVAILABLES_LOCALES)

export const normalizeLocale = (locale: string): LocaleCode => {
  const lower = locale.toLowerCase()
  const matched = SUPPORTED_LOCALES.find((code) => lower === code || lower.startsWith(`${code}-`))
  return matched ?? FALLBACK_LOCALE
}

/**
 * Resout les locales effectives = catalogue supporte ∩ locales activees du projet.
 * Conserve l'ordre de `AVAILABLES_LOCALES` et ignore les codes inconnus.
 */
export const resolveEnabledLocales = (enabled: readonly string[]): LocaleInfo[] => {
  const enabledSet = new Set(enabled.filter(isLocaleCode))
  return (Object.values(AVAILABLES_LOCALES) as LocaleInfo[]).filter((locale) =>
    enabledSet.has(locale.code),
  )
}

/** Normalise une locale source en retombant sur `FALLBACK_LOCALE` si inconnue. */
export const resolveSourceLocale = (source: string | undefined): LocaleCode =>
  isLocaleCode(source) ? source : FALLBACK_LOCALE
