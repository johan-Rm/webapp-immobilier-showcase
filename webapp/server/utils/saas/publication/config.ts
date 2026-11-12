import type { H3Event } from 'h3'

import { timingSafeEqual } from 'node:crypto'

import { getHeader } from 'h3'
import { z } from 'zod'

import { saasFailure } from '../auth/runtime'

export const publicationTarget = (projectId: string) => {
  let value: unknown
  try {
    value = JSON.parse(process.env.SAAS_PUBLICATION_PROJECTS || '{}')
  } catch {
    return saasFailure(503, 'publication_configuration_unavailable')
  }
  const targets = z.record(z.uuid(), z.literal('client2-immobilier')).safeParse(value)
  if (!targets.success) return saasFailure(503, 'publication_configuration_unavailable')
  return targets.data[projectId] ?? saasFailure(503, 'publication_target_unavailable')
}
export const privateBridgeSecret = (name: 'SAAS_PROJECTION_SECRET' | 'SAAS_PREVIEW_SECRET') => {
  const secret = process.env[name] ?? ''
  if (secret.length < 32) return saasFailure(503, 'bridge_configuration_unavailable')
  return secret
}
export const requireProjectionWorker = (event: H3Event) => {
  const secret = privateBridgeSecret('SAAS_PROJECTION_SECRET')
  const given = getHeader(event, 'authorization') ?? ''
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(given)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return saasFailure(401, 'authentication_required')
}
export const previewRendererOrigin = () => {
  try {
    const url = new URL(process.env.SAAS_CLIENT2_PREVIEW_ORIGIN || '')
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    )
      return saasFailure(503, 'preview_configuration_unavailable')
    return url.origin
  } catch {
    return saasFailure(503, 'preview_configuration_unavailable')
  }
}
