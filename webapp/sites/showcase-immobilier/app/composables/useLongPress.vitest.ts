import { describe, expect, it } from 'vitest'

import { exceedsMoveThreshold } from './useLongPress'

describe('exceedsMoveThreshold', () => {
  const start = { x: 100, y: 100 }

  it('retourne false quand le déplacement reste sous le seuil', () => {
    expect(exceedsMoveThreshold(start, { x: 105, y: 100 }, 10)).toBe(false)
  })

  it('retourne false quand le déplacement est nul', () => {
    expect(exceedsMoveThreshold(start, { x: 100, y: 100 }, 10)).toBe(false)
  })

  it('retourne true quand le déplacement dépasse le seuil sur un axe', () => {
    expect(exceedsMoveThreshold(start, { x: 120, y: 100 }, 10)).toBe(true)
  })

  it('mesure une distance euclidienne (diagonale)', () => {
    // distance = √(8² + 8²) ≈ 11.3 > 10
    expect(exceedsMoveThreshold(start, { x: 108, y: 108 }, 10)).toBe(true)
    // distance = √(6² + 6²) ≈ 8.49 < 10
    expect(exceedsMoveThreshold(start, { x: 106, y: 106 }, 10)).toBe(false)
  })
})
