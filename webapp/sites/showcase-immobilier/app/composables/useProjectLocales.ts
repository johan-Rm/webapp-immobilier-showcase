import type { ComputedRef, Ref } from 'vue'

import {
  FALLBACK_LOCALE,
  SUPPORTED_LOCALES,
  isLocaleCode,
  resolveEnabledLocales,
} from '#shared/utils/locale'

/**
 * Locales effectives du projet courant cote client.
 *
 * Le state `project.locales` est hydrate par le plugin `project-locales`
 * (resolu en SSR depuis content/fr/ui/app.yaml). Par defaut, tout le catalogue est actif tant
 * que la resolution n'a pas eu lieu, pour eviter de masquer une langue a tort.
 */
export type UseProjectLocalesReturn = {
  config: Ref<ProjectLocalesConfig>
  enabledLocales: ComputedRef<LocaleInfo[]>
  sourceLocale: ComputedRef<LocaleCode>
  isEnabledLocale: (code: string | undefined) => code is LocaleCode
}

export const useProjectLocales = (): UseProjectLocalesReturn => {
  const config = useState<ProjectLocalesConfig>('project.locales', () => ({
    sourceLocale: FALLBACK_LOCALE,
    enabledLocales: [...SUPPORTED_LOCALES],
  }))

  const enabledLocales = computed<LocaleInfo[]>(() =>
    resolveEnabledLocales(config.value.enabledLocales),
  )

  const sourceLocale = computed<LocaleCode>(() => config.value.sourceLocale)

  const isEnabledLocale = (code: string | undefined): code is LocaleCode =>
    isLocaleCode(code) && config.value.enabledLocales.includes(code)

  return { config, enabledLocales, sourceLocale, isEnabledLocale }
}
