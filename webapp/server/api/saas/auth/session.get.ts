import { defineEventHandler } from 'h3'

import { saasSession } from '../../../utils/saas/auth/handlers'

export default defineEventHandler(saasSession)
