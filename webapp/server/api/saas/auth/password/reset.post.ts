import { defineEventHandler } from 'h3'

import { unsupportedSaas } from '../../../../utils/saas/auth/handlers'

export default defineEventHandler(unsupportedSaas)
