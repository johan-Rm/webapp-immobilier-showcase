import { defineEventHandler } from 'h3'

import { saasLogin } from '../../../utils/saas/auth/handlers'

export default defineEventHandler(saasLogin)
