import type { ProjectLocalesConfig } from '#shared/types/i18n'

import { parseProjectLocales } from '../../services/content/projectLocales'

import { loadContentFromFiles } from './content/loaders'

import { FALLBACK_LOCALE } from '#shared/utils/locale'

/** Lit la copie locale des langues synchronisée dans content/fr/ui/app.yaml. */
export async function getProjectLocales(): Promise<ProjectLocalesConfig> {
  const app = await loadContentFromFiles<{ i18n?: unknown }>('app', FALLBACK_LOCALE)
  return parseProjectLocales(app.i18n)
}
