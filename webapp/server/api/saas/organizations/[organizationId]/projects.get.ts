import { defineEventHandler } from 'h3'

import { listSaasProjects, saasResourceId } from '../../../../utils/saas/auth/access'
import { saasEndpoint } from '../../../../utils/saas/auth/runtime'

export default defineEventHandler((event) =>
  saasEndpoint(event, () => listSaasProjects(event, saasResourceId(event, 'organizationId'))),
)
