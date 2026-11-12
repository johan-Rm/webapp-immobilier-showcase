import { isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import { projectionFailure } from './contract'

const applicationRoot = fileURLToPath(new URL('../..', import.meta.url))
const origin = (value: string | undefined) => {
  try {
    const url = new URL(value || '')
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.pathname !== '/' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return projectionFailure('configuration_unavailable')
    return url.origin
  } catch {
    return projectionFailure('configuration_unavailable')
  }
}
export const projectionConfig = (
  env: Record<string, string | undefined> = process.env,
  root = applicationRoot,
) => {
  const project = z.uuid().safeParse(env.SAAS_PROJECTION_PROJECT_ID)
  const secret = env.SAAS_PROJECTION_SECRET ?? ''
  if (!project.success || secret.length < 32) return projectionFailure('configuration_unavailable')
  const boundary = resolve(root)
  const dataRoot = resolve(boundary, env.SAAS_PROJECTION_ROOT || '.data/saas-projection')
  const path = relative(boundary, dataRoot)
  if (!path || path === '..' || path.startsWith('../') || isAbsolute(path))
    return projectionFailure('unsafe_path')
  return {
    projectId: project.data,
    secret,
    boundary,
    dataRoot,
    target: 'client2-immobilier' as const,
    dashboardUrl: origin(env.SAAS_DASHBOARD_URL),
    dashboardOrigin: origin(env.SAAS_DASHBOARD_ORIGIN),
    sourceOrigin: origin(env.SAAS_PROJECTION_SOURCE_ORIGIN),
  }
}
