export type LocaleCode = 'fr' | 'en' | 'es'

export type LocaleInfo = {
  code: LocaleCode
  iso: string
  name: string
  dir: 'ltr' | 'rtl'
  flag: string
}

/** Configuration commune des langues, définie dans content/fr/ui/app.yaml. */
export type ProjectLocalesConfig = {
  sourceLocale: LocaleCode
  enabledLocales: LocaleCode[]
}
