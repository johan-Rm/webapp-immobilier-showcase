import { defineEventHandler } from 'h3'

import { saasMediaUpload } from '../../../../../utils/saas/media/handlers'

export default defineEventHandler(saasMediaUpload)
