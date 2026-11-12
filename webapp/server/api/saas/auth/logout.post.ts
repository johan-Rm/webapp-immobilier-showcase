import { defineEventHandler } from 'h3'

import { saasLogout } from '../../../utils/saas/auth/handlers'

export default defineEventHandler(saasLogout)
