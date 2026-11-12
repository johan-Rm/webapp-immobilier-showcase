import type { H3Event } from 'h3'

import { createHash } from 'node:crypto'

import { getHeader, getQuery } from 'h3'
import { z } from 'zod'

import { saasConfig, saasFailure } from '../auth/runtime'
import { authorizedSaasRequest } from '../auth/session'

export const nativeParse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const parsed = schema.safeParse(value)
  return parsed.success ? parsed.data : saasFailure(502, 'upstream_invalid')
}
export const inputParse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const parsed = schema.safeParse(value)
  return parsed.success ? parsed.data : saasFailure(400, 'invalid_request')
}
export const nativeId = (relation: string) => relation.split('/').at(-1)
export const checkProject = (relation: string, projectId: string) => {
  if (nativeId(relation) !== projectId) saasFailure(502, 'upstream_project_mismatch')
}
export const editorCollection = async (event: H3Event, path: string): Promise<unknown[]> => {
  const origin = saasConfig().api
  let url = new URL(path, origin)
  const pathname = url.pathname
  const visited = new Set<string>()
  const items: unknown[] = []
  while (true) {
    if (
      url.origin !== origin ||
      url.pathname !== pathname ||
      url.username ||
      url.password ||
      url.hash ||
      visited.has(url.href) ||
      visited.size >= 1000
    )
      return saasFailure(502, 'upstream_invalid')
    visited.add(url.href)
    const raw = await authorizedSaasRequest(event, url.href)
    if (Array.isArray(raw)) {
      items.push(...raw)
      return items
    }
    const page = nativeParse(
      z.object({
        member: z.array(z.unknown()).optional(),
        'hydra:member': z.array(z.unknown()).optional(),
        view: z.object({ next: z.string().optional() }).optional(),
        'hydra:view': z.object({ 'hydra:next': z.string().optional() }).optional(),
      }),
      raw,
    )
    const rows = page.member ?? page['hydra:member']
    if (!rows) return saasFailure(502, 'upstream_invalid')
    items.push(...rows)
    const next = page.view?.next ?? page['hydra:view']?.['hydra:next']
    if (!next) return items
    url = new URL(next, url)
  }
}
export const editorQuery = (event: H3Event) =>
  inputParse(
    z
      .object({
        q: z.string().max(200).default(''),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
      })
      .strict(),
    getQuery(event),
  )
export const editorPage = <T>(items: T[], query: ReturnType<typeof editorQuery>) => ({
  items: items.slice((query.page - 1) * query.pageSize, query.page * query.pageSize),
  total: items.length,
  page: query.page,
  pageSize: query.pageSize,
  hasNext: query.page * query.pageSize < items.length,
})
export const readEditorBuffer = async (event: H3Event, limit: number) => {
  const chunks: Buffer[] = []
  let size = 0
  // Drain oversized bodies without retaining their bytes, so a 413 response remains possible.
  for await (const chunk of event.node.req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += bytes.length
    if (size <= limit) chunks.push(bytes)
  }
  if (size > limit) return saasFailure(413, 'payload_too_large')
  return Buffer.concat(chunks)
}
export const readEditorJson = async (event: H3Event) => {
  if (!getHeader(event, 'content-type')?.toLowerCase().startsWith('application/json'))
    return saasFailure(415, 'unsupported_media_type')
  const raw = await readEditorBuffer(event, 2 * 1024 * 1024)
  try {
    return JSON.parse(raw.toString('utf8')) as unknown
  } catch {
    return saasFailure(400, 'invalid_request')
  }
}
const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    )
  return value
}
export const editorRevision = (value: unknown) =>
  `"sha256-${createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex')}"`
export const requireEditorRevision = (event: H3Event, revision: string) => {
  const provided = getHeader(event, 'if-match')
  if (!provided) return saasFailure(428, 'revision_required')
  if (provided !== revision) return saasFailure(409, 'revision_conflict')
}
const queues = new Map<string, Promise<unknown>>()
export const editorLock = async <T>(key: string, operation: () => Promise<T>): Promise<T> => {
  const previous = queues.get(key) ?? Promise.resolve()
  const pending = previous.catch(() => undefined).then(operation)
  queues.set(key, pending)
  try {
    return await pending
  } finally {
    if (queues.get(key) === pending) queues.delete(key)
  }
}
