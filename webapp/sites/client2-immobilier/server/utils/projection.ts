import { readFile, lstat } from 'node:fs/promises'
import { resolve, join, relative, isAbsolute } from 'node:path'

import { createError } from 'h3'
import { z } from 'zod'

import { digest, manifestSchema, pointerSchema } from '../../../../scripts/saas/contract'
import { safeProjectionPath } from '../../../../scripts/saas/storage'

export const publicProject = () => {
  const parsed = z.uuid().safeParse(process.env.SAAS_PROJECTION_PROJECT_ID)
  if (!parsed.success)
    throw createError({ statusCode: 503, statusMessage: 'Articles indisponibles' })
  return parsed.data
}
const projectionRoot = async () => {
  const boundary = process.cwd()
  const root = resolve(
    boundary,
    process.env.SAAS_PROJECTION_ROOT || '.data/saas-projection',
    'client2-immobilier',
  )
  const local = relative(boundary, root)
  if (local === '..' || local.startsWith('../') || isAbsolute(local))
    throw createError({ statusCode: 503, statusMessage: 'Projection indisponible' })
  await safeProjectionPath(boundary, root)
  return root
}
export const publishedRelease = async (release?: string) => {
  const projectId = publicProject()
  try {
    const root = await projectionRoot()
    const pointer = pointerSchema.parse(
      JSON.parse(
        await readFile(await safeProjectionPath(process.cwd(), join(root, 'current.json')), 'utf8'),
      ),
    )
    if (
      pointer.projectId !== projectId ||
      pointer.release !== `g${pointer.generation}-${pointer.version}`
    )
      throw new Error('project mismatch')
    const selected = release ?? pointer.release
    if (!/^g[0-9]+-[a-f0-9]{64}$/.test(selected)) throw createError({ statusCode: 404 })
    const path = await safeProjectionPath(process.cwd(), join(root, 'releases', selected))
    const bytes = await readFile(
      await safeProjectionPath(process.cwd(), join(path, 'manifest.json')),
    )
    const version = selected.slice(selected.indexOf('-') + 1)
    if (digest(bytes) !== version) throw new Error('checksum mismatch')
    const manifest = manifestSchema.parse(JSON.parse(bytes.toString()))
    if (
      manifest.projectId !== projectId ||
      selected !== `g${manifest.generation}-${version}` ||
      manifest.articles.some((a) => a.projectId !== projectId)
    )
      throw new Error('project mismatch')
    return { manifest, release: selected, path }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' && !release) return null
    throw createError({
      statusCode: release ? 404 : 503,
      statusMessage: release ? 'Média introuvable' : 'Projection indisponible',
    })
  }
}
export const publicMedia = (value: NonNullable<Awaited<ReturnType<typeof publishedRelease>>>) =>
  Object.fromEntries(
    value.manifest.media.map((m) => [m.id, `/article-media/${value.release}/${m.path.slice(6)}`]),
  )
export const publishedMedia = async (release: string, file: string) => {
  const value = await publishedRelease(release)
  const media = value?.manifest.media.find((item) => item.path === 'media/' + file)
  if (!media || !value) throw createError({ statusCode: 404 })
  const path = await safeProjectionPath(process.cwd(), join(value.path, media.path))
  const info = await lstat(path)
  if (!info.isFile() || info.size !== media.bytes) throw createError({ statusCode: 404 })
  const bytes = await readFile(path)
  if (digest(bytes) !== media.sha256) throw createError({ statusCode: 404 })
  return { bytes, mimeType: media.mimeType, sha256: media.sha256 }
}
