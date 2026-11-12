import { defineEventHandler } from 'h3'

import { listSaasOrganizations } from '../../../utils/saas/auth/access'
import { saasEndpoint } from '../../../utils/saas/auth/runtime'

export default defineEventHandler((event) =>
  saasEndpoint(event, () => listSaasOrganizations(event)),
)
