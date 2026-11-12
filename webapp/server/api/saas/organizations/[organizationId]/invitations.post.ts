import { defineEventHandler } from 'h3'

import { unsupportedSaasAdministration } from '../../../../utils/saas/auth/handlers'

export default defineEventHandler(unsupportedSaasAdministration)
