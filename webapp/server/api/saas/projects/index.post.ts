import { defineEventHandler } from 'h3'

import { createSaasProject } from '../../../utils/saas/auth/access'
import { saasEndpoint } from '../../../utils/saas/auth/runtime'

export default defineEventHandler((event) => saasEndpoint(event, () => createSaasProject(event)))
