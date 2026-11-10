import type { DashboardMediaObject } from '#shared/types/dashboardAccommodation'
import type { CategoryCode } from '@schemas/interfaces'

import { useMetadataStore } from '~/stores/metadata'
import { loadContentResource } from '~/utils/loadContentResource'

type UseMetadataReturn = {
  loadApp: () => Promise<void>
  loadAccommodationForm: () => Promise<void>
  loadDashboardContent: () => Promise<void>
  loadAccommodationUi: () => Promise<void>
  loadAllMetadata: () => Promise<void>
  loadCategoryCodes: () => Promise<void>
  loadMediaObjects: () => Promise<void>
}

export const useMetadata = (): UseMetadataReturn => {
  const { localeSetting } = useLang()
  const store = useMetadataStore()

  const loadApp = async (): Promise<void> => {
    const appData = await loadContentResource<App>('app', localeSetting.value)
    store.setApp(appData)
  }

  const loadAccommodationForm = async (): Promise<void> => {
    const formData = await loadContentResource<AccommodationForm>(
      'forms/accommodation',
      localeSetting.value,
    )
    store.setAccommodationForm(formData)
  }

  const loadDashboardContent = async (): Promise<void> => {
    const data = await loadContentResource<DashboardContent>('dashboard', localeSetting.value)
    store.setDashboardContent(data)
  }

  const loadAccommodationUi = async (): Promise<void> => {
    const data = await loadContentResource<AppAccommodation>(
      'ui/accommodation',
      localeSetting.value,
    )
    store.setAccommodationUi(data)
  }

  const loadCategoryCodes = async (): Promise<void> => {
    const items = await loadContentResource<CategoryCode[]>('category-code', localeSetting.value)
    store.setCategoryCodes(items)
  }

  const loadMediaObjects = async (): Promise<void> => {
    const mediaObjectItems = await loadContentResource<DashboardMediaObject[]>(
      'media-object',
      localeSetting.value,
    )
    store.setMediaObjects(mediaObjectItems)
  }

  const loadAllMetadata = async (): Promise<void> => {
    await Promise.all([loadApp(), loadAccommodationUi(), loadCategoryCodes(), loadMediaObjects()])
  }

  return {
    loadApp,
    loadAccommodationForm,
    loadDashboardContent,
    loadAccommodationUi,
    loadAllMetadata,
    loadCategoryCodes,
    loadMediaObjects,
  }
}
