import { defineEventHandler } from 'h3'

import { saasArticleSave } from '../../../../../../../utils/saas/articles/handlers'

export default defineEventHandler(saasArticleSave)
