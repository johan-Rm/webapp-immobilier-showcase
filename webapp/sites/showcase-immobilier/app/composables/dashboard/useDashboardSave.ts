import { toValue } from 'vue'

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

type DashboardSaveResponse = {
  success: true
  uuid: string
  markdownUpdated: boolean
  contentUpdated: boolean
  reconciliationRequired: boolean
  data: unknown
  freshAccommodation: DashboardAccommodation | null
  freshTranslations: DashboardAccommodationTranslationPayload[]
}

export const useDashboardSave = () => {
  const { localeSetting } = useLang()
  const status = ref<SaveStatus>('idle')
  const errorMessage = ref<string | null>(null)
  const markdownUpdated = ref<boolean | null>(null)
  const lastSavedData = ref<unknown | null>(null)
  const freshAccommodation = ref<DashboardAccommodation | null>(null)
  const freshTranslations = ref<DashboardAccommodationTranslationPayload[]>([])

  const savePayload = async (
    accommodation: DashboardAccommodationSavePayload,
    locale: LocaleCode,
  ): Promise<boolean> => {
    status.value = 'saving'
    errorMessage.value = null
    markdownUpdated.value = null
    lastSavedData.value = null

    try {
      const result = await $fetch<DashboardSaveResponse>(
        `/api/dashboard/accommodations/${encodeURIComponent(accommodation.identifier)}`,
        { method: 'PUT', query: { locale }, body: accommodation },
      )

      markdownUpdated.value = result.markdownUpdated
      lastSavedData.value = result.data
      freshAccommodation.value = result.freshAccommodation ?? null
      freshTranslations.value = result.freshTranslations ?? []

      status.value = 'success'

      setTimeout(() => {
        if (status.value === 'success') status.value = 'idle'
      }, 3000)

      return true
    } catch (err: unknown) {
      status.value = 'error'
      freshAccommodation.value = null
      freshTranslations.value = []
      const message = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      errorMessage.value = message
      return false
    }
  }

  const save = async (accommodation: DashboardAccommodation): Promise<boolean> => {
    return savePayload(accommodation, toValue(localeSetting))
  }

  const saveMultilingual = async (
    accommodation: DashboardAccommodationSavePayload,
    locale: LocaleCode,
  ): Promise<boolean> => {
    return savePayload(accommodation, locale)
  }

  const reset = () => {
    status.value = 'idle'
    errorMessage.value = null
    markdownUpdated.value = null
    lastSavedData.value = null
    freshAccommodation.value = null
    freshTranslations.value = []
  }

  return {
    status,
    errorMessage,
    markdownUpdated,
    lastSavedData,
    freshAccommodation,
    freshTranslations,
    save,
    saveMultilingual,
    reset,
  }
}
