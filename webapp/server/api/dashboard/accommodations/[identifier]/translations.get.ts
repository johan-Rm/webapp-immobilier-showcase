import type { DashboardAccommodationTranslationsResponse } from '#shared/types/dashboardAccommodation'

import { loadDashboardAccommodationTranslations } from '../../../../utils/dashboard/accommodations'
import { getProjectLocales } from '../../../../utils/projectLocales'

export default defineEventHandler(
  async (event): Promise<DashboardAccommodationTranslationsResponse> => {
    await requireUserSession(event)

    const identifier = getRouterParam(event, 'identifier')
    if (!identifier) {
      throw createError({ statusCode: 400, statusMessage: 'Missing accommodation identifier' })
    }

    const { enabledLocales } = await getProjectLocales()
    const translations = await loadDashboardAccommodationTranslations(identifier, enabledLocales)
    return { translations }
  },
)
