type ContentVersion = {
  version: string
  updatedAt: string
}

type UseContentVersionOptions = {
  intervalMs?: number
  onChanged?: () => Promise<void>
}

const DEFAULT_CONTENT_VERSION_INTERVAL_MS = 30_000

export const useContentVersion = (options: UseContentVersionOptions = {}): void => {
  if (!import.meta.client) return

  // Sortie statique : aucune API derriere la page. Interroger la version du
  // contenu produirait une erreur reseau a chaque intervalle, sans objet
  // puisque le contenu est fige au moment de la generation.
  if (useRuntimeConfig().public.staticOutput === true) return

  const { localeSetting } = useLang()
  const { loadAccommodations } = useAccommodation()
  const intervalMs = options.intervalMs ?? DEFAULT_CONTENT_VERSION_INTERVAL_MS
  const version = useState<string>('content-version:accommodations', () => '')
  const isRefreshing = useState<boolean>('content-version:refreshing', () => false)

  const fetchVersion = async (): Promise<ContentVersion> => {
    return $fetch<ContentVersion>('/api/content-version', {
      query: { locale: localeSetting.value },
    })
  }

  const refreshContent = async (): Promise<void> => {
    if (isRefreshing.value) return
    isRefreshing.value = true

    try {
      if (options.onChanged) {
        await options.onChanged()
      } else {
        await loadAccommodations()
      }
    } finally {
      isRefreshing.value = false
    }
  }

  const checkVersion = async (): Promise<void> => {
    if (document.visibilityState === 'hidden') return

    const next = await fetchVersion()
    if (!version.value) {
      version.value = next.version
      await refreshContent()
      return
    }

    if (next.version === version.value) return

    version.value = next.version
    await refreshContent()
  }

  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    void checkVersion()

    timer = setInterval(() => {
      void checkVersion()
    }, intervalMs)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })
}
