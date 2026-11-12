import type { projectionConfig } from './config'

import { randomUUID } from 'node:crypto'
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

import { checked, digest, manifestSchema, projectionFailure, validatedExport } from './contract'
import {
  activateProjection,
  projectionLock,
  projectionPaths,
  readProjection,
  safeProjectionPath,
  writeProjectionFile,
} from './storage'

const boundedBody = async (response: Response, limit: number) => {
  const reader = response.body?.getReader()
  if (!reader) return projectionFailure('invalid_response')
  const chunks: Uint8Array[] = []
  let length = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.length
    if (length > limit) {
      await reader.cancel()
      return projectionFailure('response_too_large')
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}
const imageMime = (bytes: Buffer) => {
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
const extension = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
} as const
export const runProjection = async (
  config: ReturnType<typeof projectionConfig>,
  dryRun = false,
  transport: typeof fetch = fetch,
) => {
  const endpoint = `${config.dashboardUrl}/api/saas/projects/${config.projectId}/publication`
  const getExport = async () => {
    let response: Response
    try {
      response = await transport(endpoint + '/queue', {
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Bearer ${config.secret}`, Accept: 'application/json' },
      })
    } catch {
      return projectionFailure('dashboard_unavailable')
    }
    if (!response.ok) return projectionFailure('dashboard_unavailable')
    let raw: unknown
    try {
      raw = JSON.parse((await boundedBody(response, 32 * 1024 * 1024)).toString())
    } catch {
      return projectionFailure('invalid_projection')
    }
    return validatedExport(raw, config.projectId, config.sourceOrigin)
  }
  const acknowledge = async (
    generation: number,
    state: 'applied' | 'failed',
    errorCode?: 'asset_unavailable' | 'invalid_projection' | 'projection_failed',
  ) => {
    try {
      const response = await transport(endpoint + '/ack', {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${config.secret}`,
          Origin: config.dashboardOrigin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generation, state, ...(errorCode ? { errorCode } : {}) }),
      })
      if (!response.ok) return false
      const raw = JSON.parse((await boundedBody(response, 8192)).toString()) as {
        generation?: unknown
        state?: unknown
      }
      return raw.generation === generation && raw.state === state
    } catch {
      return false
    }
  }
  const source = await getExport()
  const current = await readProjection(config)
  if (current && source.value.generation < current.pointer.generation)
    return projectionFailure('generation_regression')
  if (dryRun)
    return {
      state: 'dry-run' as const,
      generation: source.value.generation,
      articles: source.value.entries.length,
      media: source.assets.length,
      acknowledged: false,
    }
  if (source.value.generation === 0)
    return { state: 'idle' as const, generation: 0, articles: 0, media: 0, acknowledged: false }
  return projectionLock(config, async () => {
    const active = await readProjection(config)
    if (active && source.value.generation < active.pointer.generation)
      return projectionFailure('generation_regression')
    if (active?.pointer.generation === source.value.generation) {
      if (active.manifest.sourceVersion !== source.sourceVersion)
        return projectionFailure('generation_content_conflict')
      const acknowledged = await acknowledge(source.value.generation, 'applied')
      return {
        state: acknowledged ? ('applied' as const) : ('ack-pending' as const),
        generation: source.value.generation,
        articles: active.manifest.articles.length,
        media: active.manifest.media.length,
        acknowledged,
      }
    }
    const paths = projectionPaths(config)
    const stage = join(paths.root, `.staging-${randomUUID()}`)
    await safeProjectionPath(config.boundary, stage)
    await mkdir(stage, { mode: 0o700 })
    await mkdir(join(stage, 'media'), { mode: 0o755 })
    const media = []
    let committed = false
    try {
      for (const asset of source.assets) {
        let response: Response
        try {
          response = await transport(config.sourceOrigin + asset.sourcePath, {
            redirect: 'error',
            signal: AbortSignal.timeout(15000),
            headers: { Accept: asset.mimeType },
          })
        } catch {
          return projectionFailure('asset_unavailable')
        }
        if (!response.ok || response.headers.get('content-type')?.split(';')[0] !== asset.mimeType)
          return projectionFailure('asset_unavailable')
        const bytes = await boundedBody(response, 12 * 1024 * 1024)
        if (!bytes.length || imageMime(bytes) !== asset.mimeType)
          return projectionFailure('asset_unavailable')
        const sha256 = digest(bytes)
        const path = `media/${asset.id}-${sha256}.${extension[asset.mimeType]}`
        await writeProjectionFile(join(stage, path), bytes)
        media.push({ id: asset.id, path, mimeType: asset.mimeType, sha256, bytes: bytes.length })
      }
      const articles = source.value.entries
        .map((entry) => entry.article)
        .sort(
          (a, b) =>
            a.locale.localeCompare(b.locale) ||
            b.publishedAt.localeCompare(a.publishedAt) ||
            a.id.localeCompare(b.id),
        )
      const indexes = { fr: [], en: [], es: [] } as Record<
        'fr' | 'en' | 'es',
        { id: string; slug: string; snapshotId: string }[]
      >
      for (const article of articles)
        indexes[article.locale].push({
          id: article.id,
          slug: article.slug,
          snapshotId: article.snapshotId,
        })
      const manifest = checked(manifestSchema, {
        schemaVersion: 1,
        projectId: config.projectId,
        target: config.target,
        generation: source.value.generation,
        sourceVersion: source.sourceVersion,
        articles,
        indexes,
        media,
      })
      const latest = await getExport()
      if (
        latest.value.generation !== source.value.generation ||
        latest.sourceVersion !== source.sourceVersion
      )
        return projectionFailure('source_changed')
      await activateProjection(config, stage, manifest)
      committed = true
      const acknowledged = await acknowledge(source.value.generation, 'applied')
      return {
        state: acknowledged ? ('applied' as const) : ('ack-pending' as const),
        generation: source.value.generation,
        articles: articles.length,
        media: media.length,
        acknowledged,
      }
    } catch (error) {
      if (!committed) {
        const recovered = await readProjection(config).catch(() => null)
        if (
          recovered?.pointer.generation === source.value.generation &&
          recovered.manifest.sourceVersion === source.sourceVersion
        ) {
          const acknowledged = await acknowledge(source.value.generation, 'applied')
          return {
            state: acknowledged ? ('applied' as const) : ('ack-pending' as const),
            generation: source.value.generation,
            articles: recovered.manifest.articles.length,
            media: recovered.manifest.media.length,
            acknowledged,
          }
        }
        const code = (error as { code?: string }).code
        await acknowledge(
          source.value.generation,
          'failed',
          code === 'asset_unavailable' ? 'asset_unavailable' : 'projection_failed',
        )
      }
      throw error
    } finally {
      await rm(stage, { recursive: true, force: true })
    }
  })
}
