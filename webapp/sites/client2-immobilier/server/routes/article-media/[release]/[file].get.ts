import { defineEventHandler, getRouterParam, setHeader } from 'h3'

import { publishedMedia } from '../../../utils/projection'
export default defineEventHandler(async (event) => {
  const media = await publishedMedia(
    getRouterParam(event, 'release') || '',
    getRouterParam(event, 'file') || '',
  )
  setHeader(event, 'Content-Type', media.mimeType)
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'ETag', '"' + media.sha256 + '"')
  return media.bytes
})
