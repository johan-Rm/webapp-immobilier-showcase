import type { projectionConfig } from './config'

import { randomUUID } from 'node:crypto'
import { chmod, lstat, mkdir, open, readFile, rename, rm } from 'node:fs/promises'
import { isAbsolute, join, relative } from 'node:path'

import {
  checked,
  digest,
  manifestSchema,
  pointerSchema,
  projectionFailure,
  stableJson,
} from './contract'

export const safeProjectionPath = async (boundary: string, path: string) => {
  const local = relative(boundary, path)
  if (local === '..' || local.startsWith('../') || isAbsolute(local))
    return projectionFailure('unsafe_path')
  let current = boundary
  for (const part of ['', ...local.split('/').filter(Boolean)]) {
    if (part) current = join(current, part)
    try {
      if ((await lstat(current)).isSymbolicLink()) return projectionFailure('unsafe_path')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
  return path
}
export const projectionPaths = (config: ReturnType<typeof projectionConfig>) => {
  const root = join(config.dataRoot, config.target)
  return {
    root,
    releases: join(root, 'releases'),
    pointer: join(root, 'current.json'),
    lock: join(root, '.projector.lock'),
  }
}
export const syncDirectory = async (path: string) => {
  const handle = await open(path, 'r')
  try {
    await handle.sync()
  } finally {
    await handle.close()
  }
}
export const writeProjectionFile = async (
  path: string,
  bytes: string | Uint8Array,
  mode = 0o644,
) => {
  const handle = await open(path, 'wx', mode)
  try {
    await handle.writeFile(bytes)
    await handle.sync()
  } finally {
    await handle.close()
  }
}
export const readProjection = async (config: ReturnType<typeof projectionConfig>) => {
  const paths = projectionPaths(config)
  await safeProjectionPath(config.boundary, paths.pointer)
  let bytes: Buffer
  try {
    bytes = await readFile(paths.pointer)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
  const pointer = checked(pointerSchema, JSON.parse(bytes.toString()))
  if (
    pointer.projectId !== config.projectId ||
    pointer.target !== config.target ||
    pointer.release !== `g${pointer.generation}-${pointer.version}`
  )
    return projectionFailure('invalid_current_projection')
  const release = await safeProjectionPath(config.boundary, join(paths.releases, pointer.release))
  const file = await readFile(
    await safeProjectionPath(config.boundary, join(release, 'manifest.json')),
  )
  if (digest(file) !== pointer.version) return projectionFailure('invalid_current_projection')
  const manifest = checked(manifestSchema, JSON.parse(file.toString()))
  if (
    manifest.projectId !== config.projectId ||
    manifest.target !== config.target ||
    manifest.generation !== pointer.generation
  )
    return projectionFailure('invalid_current_projection')
  for (const media of manifest.media) {
    const path = await safeProjectionPath(config.boundary, join(release, media.path))
    const info = await lstat(path)
    if (
      !info.isFile() ||
      info.size !== media.bytes ||
      digest(await readFile(path)) !== media.sha256
    )
      return projectionFailure('invalid_current_projection')
  }
  return { pointer, manifest, release }
}
export const projectionLock = async <T>(
  config: ReturnType<typeof projectionConfig>,
  operation: () => Promise<T>,
): Promise<T> => {
  const paths = projectionPaths(config)
  await safeProjectionPath(config.boundary, paths.lock)
  await mkdir(paths.root, { recursive: true, mode: 0o755 })
  try {
    await mkdir(paths.lock, { mode: 0o700 })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      return projectionFailure('projection_busy')
    throw error
  }
  const owner = randomUUID()
  let ownerWritten = false
  try {
    await writeProjectionFile(
      join(paths.lock, 'owner.json'),
      stableJson({ owner, pid: process.pid }),
      0o600,
    )
    ownerWritten = true
    return await operation()
  } finally {
    if (!ownerWritten) await rm(paths.lock, { recursive: true })
    else {
      const stored = JSON.parse(await readFile(join(paths.lock, 'owner.json'), 'utf8')) as {
        owner: string
      }
      if (stored.owner === owner) await rm(paths.lock, { recursive: true })
    }
  }
}
export const activateProjection = async (
  config: ReturnType<typeof projectionConfig>,
  stage: string,
  manifest: ReturnType<typeof manifestSchema.parse>,
) => {
  const paths = projectionPaths(config)
  const bytes = stableJson(manifest)
  const version = digest(bytes)
  const release = `g${manifest.generation}-${version}`
  await writeProjectionFile(join(stage, 'manifest.json'), bytes)
  await syncDirectory(join(stage, 'media'))
  await chmod(stage, 0o755)
  await syncDirectory(stage)
  await safeProjectionPath(config.boundary, paths.releases)
  await mkdir(paths.releases, { recursive: true, mode: 0o755 })
  const destination = await safeProjectionPath(config.boundary, join(paths.releases, release))
  let exists = false
  try {
    await lstat(destination)
    exists = true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  if (exists) {
    const stored = await readFile(
      await safeProjectionPath(config.boundary, join(destination, 'manifest.json')),
    )
    if (!stored.equals(Buffer.from(bytes))) return projectionFailure('invalid_current_projection')
    for (const media of manifest.media) {
      const path = await safeProjectionPath(config.boundary, join(destination, media.path))
      const info = await lstat(path)
      if (
        !info.isFile() ||
        info.size !== media.bytes ||
        digest(await readFile(path)) !== media.sha256
      )
        return projectionFailure('invalid_current_projection')
    }
  } else await rename(stage, destination)
  await syncDirectory(paths.releases)
  const pointer = {
    schemaVersion: 1 as const,
    projectId: config.projectId,
    target: config.target,
    generation: manifest.generation,
    version,
    release,
  }
  const temporary = join(paths.root, `.current-${randomUUID()}.tmp`)
  try {
    await writeProjectionFile(temporary, stableJson(pointer))
    await safeProjectionPath(config.boundary, paths.pointer)
    await rename(temporary, paths.pointer)
    await syncDirectory(paths.root)
  } finally {
    await rm(temporary, { force: true })
  }
  return pointer
}
