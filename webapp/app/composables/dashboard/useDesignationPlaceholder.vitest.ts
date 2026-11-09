import { describe, expect, it } from 'vitest'

import { buildDesignationSuggestions } from './useDesignationPlaceholder'

describe('buildDesignationSuggestions', () => {
  it('retourne des suggestions génériques sans lieu', () => {
    const suggestions = buildDesignationSuggestions('')
    expect(suggestions.length).toBeGreaterThan(1)
    expect(suggestions.every((s) => !s.includes('{lieu}'))).toBe(true)
  })

  it('ignore un lieu composé uniquement d’espaces', () => {
    expect(buildDesignationSuggestions('   ')).toEqual(buildDesignationSuggestions(''))
  })

  it('contextualise les suggestions avec le lieu choisi', () => {
    const suggestions = buildDesignationSuggestions('Médina')
    expect(suggestions.length).toBeGreaterThan(1)
    expect(suggestions.every((s) => s.includes('Médina'))).toBe(true)
    expect(suggestions.some((s) => s.includes('{lieu}'))).toBe(false)
  })

  it('trim le libellé du lieu avant interpolation', () => {
    const suggestions = buildDesignationSuggestions('  Nouvelle Ville  ')
    expect(suggestions.every((s) => s.includes('Nouvelle Ville'))).toBe(true)
    expect(suggestions.some((s) => s.includes('  Nouvelle Ville  '))).toBe(false)
  })
})
