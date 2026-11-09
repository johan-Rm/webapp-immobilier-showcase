import type { JsonFetcher } from '#shared/types/echo'

import { describe, expect, it, vi } from 'vitest'

import { postEcho } from './echo'

describe('contrat Echo partagé', () => {
  it('conserve la normalisation Zod et le résultat du transport', async () => {
    const fetcher = vi.fn<JsonFetcher>().mockResolvedValue({ echoed: 'Bonjour' })
    await expect(postEcho({ message: '  Bonjour  ' }, fetcher)).resolves.toEqual({
      echoed: 'Bonjour',
    })
    expect(fetcher).toHaveBeenCalledWith('/api/echo', {
      method: 'POST',
      body: { message: 'Bonjour' },
    })
  })

  it('rejette une requête invalide avant tout appel réseau', async () => {
    const fetcher = vi.fn<JsonFetcher>()
    await expect(postEcho({ message: '   ' }, fetcher)).rejects.toThrow()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('rejette une réponse qui ne respecte pas le schéma partagé', async () => {
    const fetcher = vi.fn<JsonFetcher>().mockResolvedValue({ echoed: 42 })
    await expect(postEcho({ message: 'Bonjour' }, fetcher)).rejects.toThrow()
  })
})
