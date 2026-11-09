import type { LocaleCode, ProjectLocalesConfig } from '../../shared/types/i18n'

import YAML from 'yaml'

import { isLocaleCode } from '../../shared/utils/locale'

/** Valide les langues de l’API ou du contenu local contre le catalogue supporté. */
export function parseProjectLocales(config: unknown): ProjectLocalesConfig {
  const invalidConfig = () => new Error('[project-locales] Configuration i18n invalide')

  if (!config || typeof config !== 'object') throw invalidConfig()
  if (!('sourceLocale' in config) || !('enabledLocales' in config)) throw invalidConfig()

  const { sourceLocale, enabledLocales } = config
  if (typeof sourceLocale !== 'string' || !isLocaleCode(sourceLocale)) throw invalidConfig()
  if (!Array.isArray(enabledLocales) || enabledLocales.length === 0) throw invalidConfig()

  const locales: LocaleCode[] = []
  for (const locale of enabledLocales) {
    if (typeof locale !== 'string' || !isLocaleCode(locale)) throw invalidConfig()
    if (!locales.includes(locale)) locales.push(locale)
  }
  if (!locales.includes(sourceLocale)) throw invalidConfig()

  return { sourceLocale, enabledLocales: locales }
}

/** Met à jour uniquement i18n, en conservant les autres champs et commentaires YAML. */
export function updateAppLocalesYaml(raw: string, config: ProjectLocalesConfig): string {
  const document = YAML.parseDocument(raw)
  if (document.errors.length > 0) throw document.errors[0]
  if (document.contents !== null && !YAML.isMap(document.contents)) {
    throw new Error('[content-sync] app.yaml doit contenir un objet YAML')
  }
  document.set('i18n', parseProjectLocales(config))
  return document.toString()
}
