import type { DashboardMediaObject } from '#shared/types/dashboardAccommodation'

import { loadContentFromFiles } from '../../../utils/content/loaders'

const getModificationTime = (item: DashboardMediaObject): number => {
  const timestamp = Date.parse(item.dateModified ?? '')
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export default defineEventHandler(async (event): Promise<DashboardMediaObject[]> => {
  await requireUserSession(event)

  const queryLocale = getQuery(event).locale
  const locale = typeof queryLocale === 'string' && queryLocale ? queryLocale : 'fr'
  const items = await loadContentFromFiles<DashboardMediaObject[]>('media-object', locale)
  return [...items].sort((left, right) => getModificationTime(right) - getModificationTime(left))
})
