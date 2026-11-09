import type { MaybeRefOrGetter } from 'vue'

import { toValue } from 'vue'

export const useDashboardAccommodations = async (enabled: MaybeRefOrGetter<boolean>) => {
  const { localeSetting } = useLang()
  const forceRefresh = ref(false)

  const fetch = useFetch<DashboardAccommodationsResponse>('/api/dashboard/accommodations', {
    query: computed(() => ({
      locale: toValue(localeSetting),
      refresh: forceRefresh.value ? '1' : undefined,
    })),
    immediate: toValue(enabled),
    watch: [localeSetting],
  })

  const refresh = async () => {
    forceRefresh.value = true
    await fetch.refresh()
    forceRefresh.value = false
  }

  return { ...fetch, refresh }
}
