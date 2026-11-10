import type { Ref } from 'vue'
import type { RouteLocationAsRelativeGeneric, RouteParamsRawGeneric } from 'vue-router'

import { useI18n } from 'vue-i18n'

import { FALLBACK_LOCALE, AVAILABLES_LOCALES, isLocaleCode } from '#shared/utils/locale'

export type Locales = Record<LocaleCode, LocaleInfo>
type LocalizedParams = RouteParamsRawGeneric
type ParamsInput = LocalizedParams | Partial<Record<LocaleCode, LocalizedParams>>
type RouteDef = Omit<RouteLocationAsRelativeGeneric, 'name' | 'params'> & {
  name?: string
  params?: LocalizedParams
}

export const availableLocales: Locales = AVAILABLES_LOCALES

/**
 * Composable singleton pour la gestion des langues et des routes localisées.
 * - Initialise/synchronise la locale (route > navigateur, fallback fr)
 * - Expose la traduction (t) et la génération d’URL localisée
 */
export type UseLangReturn = {
  t: ReturnType<typeof useI18n>['t']
  getLocalizedRoute: (routeDef: RouteDef, params?: ParamsInput) => string
  localeSetting: Ref<LocaleCode>
  availableLocales: Locales
}

/**
 * Gère la résolution et la synchronisation de la locale.
 *
 * Règles :
 * - priorité à la locale de route si elle est présente
 * - fallback sur la locale système si possible
 * - fallback final sur la locale par défaut
 *
 * @returns API de localisation (t, locale courante, helpers d’URL).
 *
 * @see useI18n
 * @see useRoute
 * @see useRouter
 */
const _useLang = (): UseLangReturn => {
  const { t, locale } = useI18n()
  const router = useRouter()
  const route = useRoute()

  const localeSetting = useState<LocaleCode>('locale.setting', () => FALLBACK_LOCALE)

  // La locale système sert de fallback lorsque l’URL n’impose pas de langue.
  const getSystemLocale = (): LocaleCode => {
    if (typeof window === 'undefined') return FALLBACK_LOCALE
    const foundLang = window.navigator.language.substring(0, 2).toLowerCase()
    return isLocaleCode(foundLang) ? foundLang : FALLBACK_LOCALE
  }

  // Déduit la locale depuis l’URL afin d’aligner le state sur le routing.
  const getLocaleFromRoute = (): LocaleCode | null => {
    const param = route.params?.locale as string | undefined
    if (isLocaleCode(param)) return param
    const path = route.path || ''
    const match = path.match(/^\/([a-z]{2})(?:\/|$)/i)
    const code = match?.[1]?.toLowerCase()
    return isLocaleCode(code) ? code : null
  }

  const resolveInitialLocale = (): LocaleCode => {
    return getLocaleFromRoute() ?? getSystemLocale()
  }

  // Initialisation unique : on aligne le state local et vue-i18n.
  const initial = resolveInitialLocale()
  localeSetting.value = availableLocales[initial] ? initial : FALLBACK_LOCALE
  locale.value = localeSetting.value as typeof locale.value

  // Sync store -> vue-i18n pour garder la traduction cohérente.
  watch(localeSetting, (newLocale) => {
    if (availableLocales[newLocale]) {
      locale.value = newLocale as typeof locale.value
    } else {
      localeSetting.value = FALLBACK_LOCALE
      locale.value = FALLBACK_LOCALE as typeof locale.value
    }
  })

  // Sync i18n locale -> store quand @nuxtjs/i18n met à jour la locale via la route.
  // route.params.locale est toujours undefined avec strategy:'prefix' — on écoute
  // directement le signal que le module met à jour lors des navigations.
  watch(locale, (newLocale) => {
    const code = newLocale.toString()
    if (isLocaleCode(code) && code !== localeSetting.value) {
      localeSetting.value = code
    }
  })

  /**
   * Génère une URL localisée pour une route donnée
   */
  const getLocalizedRoute = (routeDef: RouteDef, params?: ParamsInput): string => {
    if (!routeDef.name) {
      console.warn('[useLang] getLocalizedRoute: routeDef.name est requis')
    }

    const selectedParams = (
      params && localeSetting.value in params
        ? (params as Partial<Record<LocaleCode, LocalizedParams>>)[localeSetting.value]
        : params
    ) as LocalizedParams | undefined

    let localizedParams = selectedParams
    if (localizedParams && 'locale' in localizedParams) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- On force la suppression de la clé `locale`.
      const { locale: _ignoredLocale, ...rest } = localizedParams
      localizedParams = rest as LocalizedParams
    }

    const baseRoute = {
      ...routeDef,
      name: routeDef.name ? `${routeDef.name}___${localeSetting.value}` : routeDef.name,
      params: localizedParams,
    }

    const resolved = router.resolve(baseRoute)
    let { href } = resolved
    href = href.match(/^\/\/+$/) ? '/' : href
    return href
  }

  return {
    t,
    getLocalizedRoute,
    localeSetting,
    availableLocales,
  }
}

// Une instance par application Nuxt, jamais de cache au niveau module :
// `createSharedComposable` mémorise son résultat pour tout le process, donc en SSR
// la deuxième requête récupérerait la route, le i18n et le state de la première
// (fuite d'état cross-requêtes). La WeakMap garantit une instance par requête
// côté serveur et une instance unique côté client.
const instances = new WeakMap<object, UseLangReturn>()

export const useLang = (): UseLangReturn => {
  const nuxtApp = useNuxtApp()
  const existing = instances.get(nuxtApp)
  if (existing) return existing

  // Scope détaché : les watchers de synchronisation locale <-> i18n doivent survivre
  // au démontage du premier composant appelant, l'instance étant partagée ensuite.
  const instance = effectScope(true).run(() => _useLang())
  if (!instance) {
    throw new Error('[useLang] initialisation du scope impossible')
  }

  instances.set(nuxtApp, instance)
  return instance
}
