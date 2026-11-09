type InitResult = {
  loadMetadata: () => Promise<void>
  loadMainData: () => Promise<void>
  loadBackgroundData: () => Promise<void>
  initCoreData: () => Promise<boolean>
  initCoreDataStatus: Ref<'idle' | 'loading' | 'ready' | 'error'>
  isInitCoreDataReady: Readonly<Ref<boolean>>
}

/**
 * Exécute une liste de requêtes en parallèle sans lever d'exception.
 */
const runRequests = async (requests: Array<Promise<unknown>>): Promise<void> => {
  if (!requests.length) {
    return
  }
  await Promise.all(
    requests.map(async (request) => {
      try {
        await request
      } catch {
        // erreurs individuelles ignorées intentionnellement
      }
    }),
  )
}

/**
 * Initialise les données serveur pour la première requête et expose des helpers.
 * - Charge les métadonnées (relations) pour la locale courante.
 * - Charge les données principales (web pages).
 * - Planifie les données d'arrière-plan côté client après l'hydratation.
 */
export const useNuxtServerInit = (): InitResult => {
  const { startPending, stopPending } = useAppPending()
  const { loadAllMetadata } = useMetadata()
  const { loadWebPages } = useWebPage()
  const { loadAccommodations } = useAccommodation()
  const initCoreDataStatus = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'nuxt-server-init:init-core-data-status',
    () => 'idle',
  )
  const isInitCoreDataReady = computed<boolean>(() => initCoreDataStatus.value === 'ready')

  /**
   * Charge les métadonnées dépendantes de la locale (relations).
   * Vide pour le moment.
   */
  const loadMetadata = async (): Promise<void> => {
    await loadAllMetadata()
  }

  /**
   * Charge les données principales (web pages).
   */
  const loadMainData = async (): Promise<void> => {
    await loadWebPages()
  }

  /**
   * Lance les requêtes d'arrière-plan non critiques côté client.
   * Charge les accommodations après le premier rendu utile.
   */
  const loadBackgroundData = async (): Promise<void> => {
    const backgroundRequests: Array<Promise<unknown>> = [loadAccommodations()]
    await runRequests(backgroundRequests)
  }

  /**
   * Lance les métadonnées (relations) puis les données principales (bloquantes),
   * puis planifie le reste en arrière-plan.
   */
  const initCoreData = async (): Promise<boolean> => {
    initCoreDataStatus.value = 'loading'
    startPending('init-core')

    try {
      await Promise.all([loadMetadata(), loadMainData()])
      initCoreDataStatus.value = 'ready'
    } catch (error) {
      initCoreDataStatus.value = 'error'
      throw error
    } finally {
      stopPending('init-core')
    }

    return true
  }

  return {
    loadMetadata,
    loadMainData,
    loadBackgroundData,
    initCoreData,
    initCoreDataStatus,
    isInitCoreDataReady,
  }
}
