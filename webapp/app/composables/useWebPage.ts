import type { WebPageDto } from '@schemas/dtos/webPage'
import type { WebPage } from '@schemas/interfaces'
import type { ComputedRef, Ref } from 'vue'

import { computed } from 'vue'

import { useWebPageStore } from '~/stores/webPage'
import { loadContentResource } from '~/utils/loadContentResource'

/**
 * Contrat public du composable `useWebPage`.
 *
 * Il expose la locale courante, la collection réactive de pages et les helpers
 * de lookup utilisés par les pages routées et les écrans dépendants du contenu.
 */
type UseWebPageReturn = {
  locale: Ref<LocaleCode>
  items: ComputedRef<WebPage[]>
  loadWebPages: () => Promise<void>
  getPageBySlug: (slug: string) => WebPage | null
  getPageComponents: (page: WebPage | null) => IdentifiedCreativeWork[]
  getPageComponentByIdentifier: (
    page: WebPage | null,
    identifier: string,
  ) => IdentifiedCreativeWork | null
}

type PageWithSlug = WebPage & { slug?: string }
type IdentifiedCreativeWork = CreativeWork & { identifier: string }

/**
 * Uniformise les comparaisons de slugs en tolérant les écarts de casse
 * et les espaces parasites issus du contenu ou de l'URL.
 *
 * @param value Valeur brute à normaliser.
 * @returns Slug nettoyé, prêt à être comparé.
 */
const normalizeSlug = (value: string): string => value.trim().toLowerCase()

/**
 * Vérifie qu'un bloc de contenu expose un `identifier` exploitable.
 *
 * @param value Bloc issu de `hasPart`.
 * @returns `true` si le bloc peut être adressé de façon stable par identifiant.
 */
const hasIdentifier = (value: CreativeWork): value is IdentifiedCreativeWork => {
  return typeof value.identifier === 'string' && value.identifier.length > 0
}

/**
 * Expose l'accès réactif aux pages de contenu chargées dans le store.
 *
 * Responsabilités :
 * - relayer la locale courante utilisée par les loaders de contenu
 * - charger les pages Web dans le store global
 * - fournir des helpers de lookup stables par slug
 * - exposer les composants adressables d'une page via leur `identifier`
 *
 * @returns API réactive orientée contenu pour les pages et composants.
 *
 * @example
 * const { getPageBySlug, loadWebPages } = useWebPage()
 * await loadWebPages()
 * const home = getPageBySlug('home')
 */
export const useWebPage = (): UseWebPageReturn => {
  const { localeSetting } = useLang()
  // La locale réactive sert de source unique pour le chargement de contenu
  // et évite d'exposer directement le state interne de `useLang`.
  const locale = computed(() => localeSetting.value)
  const store = useWebPageStore()
  // Les items sont lus depuis le getter du store afin de bénéficier des
  // enrichissements et transformations centralisés côté état global.
  const items = computed(() => store.getWebPages)

  /**
   * Charge la collection `web-pages` pour la locale active et l'enregistre dans le store.
   *
   * @returns Promesse résolue une fois le store hydraté avec les pages reçues.
   */
  const loadWebPages = async (): Promise<void> => {
    const data = await loadContentResource<WebPageDto[]>('web-pages', locale.value)
    store.setList(data ?? [])
  }

  /**
   * Recherche une page par slug de manière tolérante à la casse.
   *
   * @param slug Slug logique de la page recherchée.
   * @returns La page correspondante ou `null` si aucune entrée n'est trouvée.
   */
  const getPageBySlug = (slug: string): WebPage | null => {
    const normalized = normalizeSlug(slug)
    return (
      items.value.find((item: WebPage) => {
        const value = normalizeSlug((item as PageWithSlug).slug ?? '')
        return value === normalized
      }) ?? null
    )
  }

  /**
   * Retourne la liste des composants adressables d'une page.
   *
   * Les composants sont les blocs `hasPart` qui exposent un `identifier`
   * stable, réutilisable par les entry points pour sélectionner leurs screens.
   *
   * @param page Page source à inspecter.
   * @returns Liste normalisée des composants adressables de la page.
   */
  const getPageComponents = (page: WebPage | null): IdentifiedCreativeWork[] => {
    // `hasPart` est un contrat générique côté orchestrateur (blocs de contenu) ;
    // on lui applique la forme riche CreativeWork définie côté frontend.
    return ((page?.hasPart ?? []) as CreativeWork[]).filter(hasIdentifier)
  }

  /**
   * Recherche un composant adressable d'une page via son identifiant.
   *
   * @param page Page source à inspecter.
   * @param identifier Identifiant technique du composant recherché.
   * @returns Composant correspondant ou `null` si aucun bloc ne matche.
   */
  const getPageComponentByIdentifier = (
    page: WebPage | null,
    identifier: string,
  ): IdentifiedCreativeWork | null => {
    return getPageComponents(page).find((component) => component.identifier === identifier) ?? null
  }

  return {
    locale,
    items,
    loadWebPages,
    getPageBySlug,
    getPageComponents,
    getPageComponentByIdentifier,
  }
}
