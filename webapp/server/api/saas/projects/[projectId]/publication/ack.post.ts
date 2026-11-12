import { defineEventHandler } from 'h3'

import { saasProjectionAck } from '../../../../../utils/saas/publication/handlers'

export default defineEventHandler(saasProjectionAck)
