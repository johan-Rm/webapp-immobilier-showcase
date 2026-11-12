import { defineEventHandler } from 'h3'

import { saasProjectionQueue } from '../../../../../utils/saas/publication/handlers'

export default defineEventHandler(saasProjectionQueue)
