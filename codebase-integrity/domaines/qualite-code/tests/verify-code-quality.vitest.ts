import { describe, expect, it } from 'vitest'

import { isCommentedCode } from '../scripts/verify-code-quality'

describe('frontière des mots dans le code commenté', () => {
  it.each([
    '// construite, le tout en annonçant un succès.',
    '// constante de configuration expliquée ici',
    '// retourner les données disponibles',
    'const message = "// const x = 1"',
  ])('ne classe pas la prose ou une chaîne comme code : %s', (line) => {
    expect(isCommentedCode(line)).toBe(false)
  })
  it.each([
    '// const x = 1',
    '  // let x = 1',
    '// function load() {}',
    '// if (ready) load()',
    '// return result',
    '// type Offer = string',
    '// interface Offer {}',
  ])('conserve la détection configurée : %s', (line) => {
    expect(isCommentedCode(line)).toBe(true)
  })
})
