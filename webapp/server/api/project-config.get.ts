import type { ProjectLocalesConfig } from '#shared/types/i18n'

import { getProjectLocales } from '../utils/projectLocales'

import { FALLBACK_LOCALE, SUPPORTED_LOCALES } from '#shared/utils/locale'

/**
 * Expose au client les locales activees du projet courant.
 *
 * Route publique (consommee par le site public et le dashboard). En cas de configuration locale
 * invalide, retombe sur le catalogue complet pour ne pas masquer de langue a tort.
 */
export default defineEventHandler(async (): Promise<ProjectLocalesConfig> => {
  try {
    return await getProjectLocales()
  } catch (error) {
    console.error('[project-config] echec resolution locales projet:', error)
    return { sourceLocale: FALLBACK_LOCALE, enabledLocales: [...SUPPORTED_LOCALES] }
  }
})
