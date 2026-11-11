import type { DashboardMediaObject } from '#shared/types/dashboardAccommodation'

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it } from 'vitest'

import { useMetadataStore } from '../app/stores/metadata'

const media = (identifier: string, dateModified?: string): DashboardMediaObject => ({
  identifier,
  dateModified,
  caption: identifier,
  url: `/images/${identifier}.jpg`,
  mainEntity: 'ImageObject',
})

beforeEach(() => setActivePinia(createPinia()))

it('trie les médias récents en premier sans modifier la liste reçue', () => {
  const store = useMetadataStore()
  const items = [
    media('missing'),
    media('old', '2025-01-01'),
    media('invalid', 'invalide'),
    media('recent', '2026-01-01'),
  ]
  store.setMediaObjects(items)
  expect(store.getImageObjects.map((item) => item.identifier)).toEqual([
    'recent',
    'old',
    'missing',
    'invalid',
  ])
  expect(items.map((item) => item.identifier)).toEqual(['missing', 'old', 'invalid', 'recent'])
})

it('garde le même tri après ajout, y compris pour les dates antérieures à 1970', () => {
  const store = useMetadataStore()
  store.setMediaObjects([media('old', '1960-01-01'), media('missing')])
  store.addMediaObject(media('recent', '2026-01-01'))
  expect(store.getImageObjects.map((item) => item.identifier)).toEqual(['recent', 'missing', 'old'])
})
