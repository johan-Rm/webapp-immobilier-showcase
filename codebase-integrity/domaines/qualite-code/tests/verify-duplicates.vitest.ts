import { describe, expect, it } from 'vitest'

import { findDuplicates } from '../scripts/verify-duplicates'

const text = (count: number) =>
  Array.from({ length: count }, (_, i) => `const variable_${i} = "long content ${i}"`).join('\n')

describe('fragments similaires', () => {
  it('regroupe les fenêtres chevauchantes et compare deux cibles', () => {
    const content = text(12)
    expect(findDuplicates({ 'a.ts': content, 'b.ts': content }, new Set(['a.ts']))).toEqual([
      { first: 'a.ts', firstLine: 1, second: 'b.ts', secondLine: 1, lines: 12 },
    ])
  })
  it('respecte les deux seuils et ne compare pas deux fichiers hors sélection', () => {
    expect(findDuplicates({ a: text(9), b: text(9) }, new Set(['a']))).toEqual([])
    expect(findDuplicates({ a: 'x\n'.repeat(10), b: 'x\n'.repeat(10) }, new Set(['a']))).toEqual([])
    expect(findDuplicates({ a: text(12), b: text(12) }, new Set(['z']))).toEqual([])
  })
  it('trouve les doublons dans un même fichier et les différences restent distinctes', () => {
    const content = `${text(10)}\nconst other = true\n${text(10)}`
    expect(findDuplicates({ a: content }, new Set(['a']))).toHaveLength(1)
    expect(
      findDuplicates({ a: text(10), b: text(10).replaceAll('variable', 'autre') }, new Set(['a'])),
    ).toEqual([])
  })
  it('normalise les espaces et ignore les commentaires isolés', () => {
    const content = text(10)
    expect(
      findDuplicates(
        { a: content, b: `// commentaire\n${content.replaceAll(' = ', '    =    ')}` },
        new Set(['a']),
      ),
    ).toHaveLength(1)
  })
})
