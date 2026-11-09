import { describe, expect, mock, test } from 'bun:test'

import { checkProjectMembership } from './symfonyProjectMember'

const API_URL = 'https://api.example.com'
const PROJECT_ID = 'aaaaaaaa-0000-0000-0000-000000000001'
const TOKEN = 'test-jwt-token'

const makeError = (statusCode: number) =>
  Object.assign(new Error(`HTTP ${statusCode}`), { statusCode })

describe('checkProjectMembership', () => {
  test("retourne true quand l'API confirme le membership", async () => {
    const fetcher = mock(async () => ({
      member: true,
      role: 'admin',
      user: { email: 'user@test.com' },
    }))

    const result = await checkProjectMembership(
      API_URL,
      PROJECT_ID,
      TOKEN,
      'user@test.com',
      fetcher,
    )

    expect(result).toBe(true)
  })

  test('retourne false sur 404 (email inconnu ou non membre)', async () => {
    const fetcher = mock(async () => {
      throw makeError(404)
    })

    const result = await checkProjectMembership(
      API_URL,
      PROJECT_ID,
      TOKEN,
      'unknown@test.com',
      fetcher,
    )

    expect(result).toBe(false)
  })

  test('propage sur 401 (token de service invalide)', async () => {
    const fetcher = mock(async () => {
      throw makeError(401)
    })

    await expect(
      checkProjectMembership(API_URL, PROJECT_ID, TOKEN, 'user@test.com', fetcher),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  test('propage sur 500 (Symfony indisponible)', async () => {
    const fetcher = mock(async () => {
      throw makeError(500)
    })

    await expect(
      checkProjectMembership(API_URL, PROJECT_ID, TOKEN, 'user@test.com', fetcher),
    ).rejects.toMatchObject({ statusCode: 500 })
  })

  test("encode l'email dans l'URL", async () => {
    let capturedUrl = ''
    const fetcher = mock(async (url: string) => {
      capturedUrl = url
      return { member: true }
    })

    await checkProjectMembership(API_URL, PROJECT_ID, TOKEN, 'user+tag@test.com', fetcher)

    expect(capturedUrl).toContain('user%2Btag%40test.com')
  })

  test('envoie le token dans le header Authorization', async () => {
    let capturedHeaders: Record<string, string> = {}
    const fetcher = mock(async (_url: string, opts: { headers: Record<string, string> }) => {
      capturedHeaders = opts.headers
      return { member: true }
    })

    await checkProjectMembership(API_URL, PROJECT_ID, TOKEN, 'user@test.com', fetcher)

    expect(capturedHeaders['Authorization']).toBe(`Bearer ${TOKEN}`)
  })

  test('retourne false si member est false dans la reponse', async () => {
    const fetcher = mock(async () => ({ member: false }))

    const result = await checkProjectMembership(
      API_URL,
      PROJECT_ID,
      TOKEN,
      'user@test.com',
      fetcher,
    )

    expect(result).toBe(false)
  })
})
