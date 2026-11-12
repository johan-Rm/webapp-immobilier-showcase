import type { H3Event } from 'h3'

import { getQuery, getRouterParam, readBody } from 'h3'
import { z } from 'zod'

import { saasConfig, saasFailure } from './runtime'
import { authorizedSaasRequest, readSaasSession } from './session'

const identity = z.object({ id: z.uuid(), name: z.string() })
const member = z.object({
  id: z.uuid(),
  role: z.string(),
  user: z.object({ id: z.uuid(), email: z.email() }),
})
const project = identity.extend({ organization: z.string() })
const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value)
  return result.success ? result.data : saasFailure(502, 'upstream_invalid')
}
const id = (value: unknown) => {
  const result = z.uuid().safeParse(value)
  return result.success ? result.data : saasFailure(400, 'invalid_request')
}
export const saasResourceId = (event: H3Event, key: string) => id(getRouterParam(event, key))
const collection = async (event: H3Event, path: string): Promise<unknown[]> => {
  const all: unknown[] = []
  const visited = new Set<string>()
  let next: string | null = path
  let base = saasConfig().api
  while (next) {
    const url = new URL(next, base)
    if (
      url.origin !== saasConfig().api ||
      !url.pathname.startsWith('/api/') ||
      visited.has(url.href) ||
      visited.size >= 1000
    )
      return saasFailure(502, 'upstream_invalid')
    visited.add(url.href)
    base = url.href
    const response = await authorizedSaasRequest(event, url.href)
    if (Array.isArray(response)) {
      all.push(...response)
      break
    }
    const page = parse(
      z.object({
        member: z.array(z.unknown()).optional(),
        'hydra:member': z.array(z.unknown()).optional(),
        view: z.object({ next: z.string().optional() }).optional(),
        'hydra:view': z.object({ 'hydra:next': z.string().optional() }).optional(),
      }),
      response,
    )
    const items = page.member ?? page['hydra:member']
    if (!items) return saasFailure(502, 'upstream_invalid')
    all.push(...items)
    next = page.view?.next ?? page['hydra:view']?.['hydra:next'] ?? null
  }
  return all
}
export const paginateSaas = <T>(event: H3Event, items: T[]) => {
  const result = z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
    })
    .strict()
    .safeParse(getQuery(event))
  if (!result.success) return saasFailure(400, 'invalid_request')
  const { page, pageSize } = result.data
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: items.length,
    hasNext: page * pageSize < items.length,
  }
}
const organizations = async (event: H3Event) =>
  parse(z.array(identity), await collection(event, '/api/organizations'))
export const requireSaasOrganization = async (event: H3Event, organizationId: string) => {
  const organization = (await organizations(event)).find((item) => item.id === organizationId)
  return organization ?? saasFailure(404, 'not_found')
}
export const listSaasOrganizations = async (event: H3Event) => {
  const items = await organizations(event)
  const mapped = []
  for (const organization of items) {
    let canManageMembers = false
    try {
      parse(
        z.array(member),
        await collection(event, `/api/organizations/${organization.id}/members`),
      )
      canManageMembers = true
    } catch (error) {
      if (![403, 404].includes((error as { statusCode: number }).statusCode)) throw error
    }
    mapped.push({ ...organization, canManageMembers })
  }
  return paginateSaas(event, mapped)
}
export const listSaasProjects = async (event: H3Event, organizationId: string) => {
  await requireSaasOrganization(event, organizationId)
  const items = parse(z.array(project), await collection(event, '/api/projects'))
  const mapped = []
  for (const item of items) {
    const owner = item.organization.split('/').at(-1)
    if (owner !== organizationId) continue
    try {
      // Listing a project in its organization does not grant access to its editorial data.
      await authorizedSaasRequest(event, `/api/projects/${item.id}/articles?page=1&itemsPerPage=1`)
      mapped.push({ id: item.id, name: item.name })
    } catch (error) {
      if (![403, 404].includes((error as { statusCode: number }).statusCode)) throw error
    }
  }
  return paginateSaas(event, mapped)
}
export const listSaasMembers = async (event: H3Event, organizationId: string) => {
  await requireSaasOrganization(event, organizationId)
  const members = parse(
    z.array(member),
    await collection(event, `/api/organizations/${organizationId}/members`),
  )
  return paginateSaas(
    event,
    members.map((item) => ({ id: item.id, email: item.user.email })),
  )
}
export const createSaasOrganization = async (event: H3Event) => {
  if (!(await readSaasSession(event)).platformAdmin) return saasFailure(403, 'forbidden')
  const body = z
    .object({ name: z.string().trim().min(1).max(160) })
    .strict()
    .safeParse(await readBody(event))
  if (!body.success) return saasFailure(400, 'invalid_request')
  return parse(
    identity,
    await authorizedSaasRequest(event, '/api/organizations', { method: 'POST', body: body.data }),
  )
}
export const createSaasProject = async (event: H3Event) => {
  if (!(await readSaasSession(event)).platformAdmin) return saasFailure(403, 'forbidden')
  const body = z
    .object({ name: z.string().trim().min(1).max(160), organizationId: z.uuid() })
    .strict()
    .safeParse(await readBody(event))
  if (!body.success) return saasFailure(400, 'invalid_request')
  await requireSaasOrganization(event, body.data.organizationId)
  return parse(
    identity,
    await authorizedSaasRequest(event, '/api/projects', {
      method: 'POST',
      body: {
        name: body.data.name,
        organization: `/api/organizations/${body.data.organizationId}`,
      },
    }),
  )
}
