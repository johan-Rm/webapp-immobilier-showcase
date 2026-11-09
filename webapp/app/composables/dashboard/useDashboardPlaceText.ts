import type { CategoryCode } from '@schemas/interfaces'

import { useMetadataStore } from '~/stores/metadata'

type PlaceTextSaveStatus = 'idle' | 'loading' | 'saving' | 'success' | 'error'

type DashboardPlaceTextResponse = {
  codeValue: string
  name: string
  inCodeSet: 'accommodation-place'
  text: string
  contentUpdated: boolean
  reconciliationRequired: boolean
}

const PLACE_CODE_SET = 'accommodation-place'

export const useDashboardPlaceText = () => {
  const metadataStore = useMetadataStore()
  const { localeSetting } = useLang()

  const placeName = ref('')
  const placeText = ref('')
  const sourceText = ref('')
  const status = ref<PlaceTextSaveStatus>('idle')
  const errorMessage = ref<string | null>(null)

  const isDirty = computed(() => placeText.value !== sourceText.value)

  const findPlace = (items: CategoryCode[], code: string): CategoryCode | null =>
    items.find((item) => item.inCodeSet === PLACE_CODE_SET && item.codeValue === code) ?? null

  const loadPlaceText = async (code: string | null, locale: LocaleCode): Promise<void> => {
    if (!code) {
      placeName.value = ''
      placeText.value = ''
      sourceText.value = ''
      status.value = 'idle'
      errorMessage.value = null
      return
    }

    status.value = 'loading'
    errorMessage.value = null

    try {
      const items = await $fetch<CategoryCode[]>('/api/content/category-code', {
        query: { locale },
      })
      const place = findPlace(items, code)
      placeName.value = place?.name ?? code
      placeText.value = place?.text ?? ''
      sourceText.value = place?.text ?? ''
      status.value = 'idle'
    } catch (error: unknown) {
      status.value = 'error'
      errorMessage.value = error instanceof Error ? error.message : 'Chargement du lieu impossible'
    }
  }

  const updatePlaceText = (value: string): void => {
    placeText.value = value
    if (status.value === 'success') status.value = 'idle'
  }

  const savePlaceText = async (code: string | null, locale: LocaleCode): Promise<boolean> => {
    if (!code || !isDirty.value || status.value === 'saving') return true

    status.value = 'saving'
    errorMessage.value = null

    try {
      const result = await $fetch<DashboardPlaceTextResponse>(
        `/api/dashboard/category-codes/${encodeURIComponent(code)}/text`,
        {
          method: 'PUT',
          body: { locale, text: placeText.value },
        },
      )
      if (!result.contentUpdated) {
        throw new Error(
          'Lieu mis à jour dans la BDD, mais le fichier content doit être resynchronisé.',
        )
      }
      placeName.value = result.name
      placeText.value = result.text
      sourceText.value = result.text

      if (locale === localeSetting.value) {
        metadataStore.updateAccommodationPlaceText(result.codeValue, result.text)
      }

      status.value = 'success'
      setTimeout(() => {
        if (status.value === 'success') status.value = 'idle'
      }, 3000)

      return true
    } catch (error: unknown) {
      status.value = 'error'
      errorMessage.value = error instanceof Error ? error.message : 'Sauvegarde du lieu impossible'
      return false
    }
  }

  return {
    placeName,
    placeText,
    status,
    errorMessage,
    isDirty,
    loadPlaceText,
    updatePlaceText,
    savePlaceText,
  }
}
