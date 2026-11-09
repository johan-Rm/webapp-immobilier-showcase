import type { DashboardAccommodationsResponse } from '#shared/types/dashboardAccommodation'

import { loadDashboardAccommodations } from '../../utils/dashboard/accommodations'

const DEFAULT_LOCALE = 'fr'

export default defineEventHandler(async (event): Promise<DashboardAccommodationsResponse> => {
  await requireUserSession(event)

  const query = getQuery(event)
  const locale =
    typeof query.locale === 'string' && query.locale.length > 0 ? query.locale : DEFAULT_LOCALE
  const force = query.refresh === '1'

  return loadDashboardAccommodations(locale, { force })
})
