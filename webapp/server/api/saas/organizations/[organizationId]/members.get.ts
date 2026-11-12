import { defineEventHandler } from 'h3'

import { listSaasMembers, saasResourceId } from '../../../../utils/saas/auth/access'
import { saasEndpoint } from '../../../../utils/saas/auth/runtime'

export default defineEventHandler((event) =>
  saasEndpoint(event, () => listSaasMembers(event, saasResourceId(event, 'organizationId'))),
)
