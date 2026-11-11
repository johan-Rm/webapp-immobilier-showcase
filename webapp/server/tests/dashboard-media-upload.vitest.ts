import type uploadHandler from '../api/dashboard/media/upload.post'

import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'

import { createEvent, defineEventHandler } from 'h3'
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'

vi.mock('../utils/dashboard/contentProjection', () => ({
  normalizeMediaUrl: (url: string) => url,
  projectMediaObject: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../utils/dashboard/symfonyAuth', () => ({
  getSymfonyServiceToken: vi.fn().mockResolvedValue('test-token'),
}))
vi.mock('../utils/projectLocales', () => ({
  getProjectLocales: vi.fn().mockResolvedValue({
    enabledLocales: ['fr', 'en', 'es'],
    sourceLocale: 'fr',
  }),
}))

let handler: typeof uploadHandler
const symfonyFetch = vi.fn()

beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', defineEventHandler)
  handler = (await import('../api/dashboard/media/upload.post')).default
})

beforeEach(() => {
  const form = new FormData()
  form.append('file', new File(['image'], 'photo.jpg', { type: 'image/jpeg' }))
  symfonyFetch.mockReset().mockResolvedValue({
    identifier: 'uploaded',
    url: '/images/uploaded.jpg',
    mainEntity: 'ImageObject',
  })
  vi.stubGlobal('requireUserSession', vi.fn().mockResolvedValue({ user: { id: 'test' } }))
  vi.stubGlobal('readFormData', vi.fn().mockResolvedValue(form))
  vi.stubGlobal('useRuntimeConfig', () => ({
    symfony: { apiUrl: 'https://api.example.test', projectId: 'test-project' },
  }))
  vi.stubGlobal('$fetch', symfonyFetch)
})

afterEach(() => vi.unstubAllGlobals())

it.each([
  { query: 'en', expected: 'en' },
  { query: ['es', 'en'], expected: 'es' },
  { query: [['en']], expected: 'en' },
  { query: [], expected: 'fr' },
  { query: [null, 'en'], expected: 'fr' },
  { query: [[42], 'en'], expected: 'fr' },
  { query: undefined, expected: 'fr' },
  { query: 'inconnue', expected: 'fr' },
])('conserve la locale upload pour la requête $query', async ({ query, expected }) => {
  vi.stubGlobal('getQuery', () => ({ locale: query }))
  const socket = new Socket()
  const request = new IncomingMessage(socket)
  const event = createEvent(request, new ServerResponse(request))
  try {
    const response = await handler(event)
    expect(response.contentUpdated).toBe(true)
    expect(symfonyFetch).toHaveBeenCalledWith(
      'https://api.example.test/api/projects/test-project/media-objects/translations',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Accept-Language': expected }),
      }),
    )
  } finally {
    socket.destroy()
  }
})
