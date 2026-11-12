import type { H3Event } from 'h3'

import { getHeader } from 'h3'

import { requireEditorProject } from '../articles/context'
import { editorPage, editorQuery, readEditorBuffer, inputParse } from '../articles/native'
import { saasResourceId } from '../auth/access'
import { saasEndpoint, saasFailure, saasConfig } from '../auth/runtime'
import { readSaasSession, authorizedSaasRequest, clearSaasSession } from '../auth/session'

import { editorMedia, mapEditorMedia } from './catalog'

import { saasLocaleSchema } from '#shared/schemas'

export const saasMediaList = (event: H3Event) =>
  saasEndpoint(event, async () => {
    const query = editorQuery(event)
    const projectId = saasResourceId(event, 'projectId')
    await requireEditorProject(event, projectId)
    return editorPage(
      (await editorMedia(event, projectId)).filter((media) =>
        media.caption.toLowerCase().includes(query.q.toLowerCase()),
      ),
      query,
    )
  })
const imageType = (bytes: Buffer) => {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return 'image/png'
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg'
  if (['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString())) return 'image/gif'
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP')
    return 'image/webp'
  if (
    bytes.subarray(4, 8).toString() === 'ftyp' &&
    ['avif', 'avis'].includes(bytes.subarray(8, 12).toString())
  )
    return 'image/avif'
  return null
}
export const saasMediaUpload = (event: H3Event) =>
  saasEndpoint(event, async () => {
    const projectId = saasResourceId(event, 'projectId')
    const project = await requireEditorProject(event, projectId)
    const contentType = getHeader(event, 'content-type') ?? ''
    if (!contentType.toLowerCase().startsWith('multipart/form-data;'))
      return saasFailure(415, 'unsupported_media_type')
    const bytes = await readEditorBuffer(event, 12 * 1024 * 1024 + 65536)
    let form: FormData
    try {
      form = await new Response(new Uint8Array(bytes), {
        headers: { 'Content-Type': contentType },
      }).formData()
    } catch {
      return saasFailure(400, 'invalid_request')
    }
    const keys = [...form.keys()]
    if (
      keys.length !== new Set(keys).size ||
      keys.some((key) => !['file', 'locale', 'caption'].includes(key))
    )
      return saasFailure(400, 'invalid_request')
    const file = form.get('file')
    const locale = inputParse(saasLocaleSchema, form.get('locale'))
    const caption = form.get('caption') ?? ''
    if (
      !(file instanceof File) ||
      !file.size ||
      typeof caption !== 'string' ||
      caption.length > 255
    )
      return saasFailure(400, 'invalid_request')
    if (!project.enabledLocales.includes(locale)) return saasFailure(400, 'locale_mismatch')
    if (file.size > 12 * 1024 * 1024) return saasFailure(413, 'payload_too_large')
    const mime = imageType(Buffer.from(await file.arrayBuffer()))
    if (!mime || (file.type !== mime && !(mime === 'image/jpeg' && file.type === 'image/jpg')))
      return saasFailure(415, 'unsupported_media_type')
    const nativeForm = new FormData()
    nativeForm.set(
      'file',
      new Blob([await file.arrayBuffer()], { type: mime }),
      file.name.replace(/[\/\\\x00-\x1f]/g, '_').slice(0, 200) || 'image',
    )
    nativeForm.set(
      'translations',
      JSON.stringify([{ locale, ...(caption.trim() ? { caption: caption.trim() } : {}) }]),
    )
    const send = async () => {
      const session = await readSaasSession(event)
      try {
        return await fetch(
          `${saasConfig().api}/api/projects/${projectId}/media-objects/translations?locale=${locale}`,
          {
            method: 'POST',
            body: nativeForm,
            headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/ld+json' },
            redirect: 'error',
            signal: AbortSignal.timeout(30000),
          },
        )
      } catch {
        return saasFailure(503, 'upstream_unavailable')
      }
    }
    let response = await send()
    if (response.status === 401) {
      await authorizedSaasRequest(event, '/api/projects')
      response = await send()
    }
    if (!response.ok) {
      if (response.status === 401) await clearSaasSession(event)
      const code: Record<number, string> = {
        400: 'invalid_request',
        401: 'authentication_required',
        403: 'forbidden',
        404: 'not_found',
        409: 'conflict',
        413: 'payload_too_large',
        415: 'unsupported_media_type',
        422: 'validation_failed',
        429: 'rate_limited',
      }
      return saasFailure(
        code[response.status] ? response.status : 502,
        code[response.status] ?? 'upstream_failed',
      )
    }
    let value: unknown
    try {
      value = await response.json()
    } catch {
      return saasFailure(502, 'upstream_invalid')
    }
    return mapEditorMedia(value, projectId, locale)
  })
