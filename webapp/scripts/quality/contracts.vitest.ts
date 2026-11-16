import { mkdtempSync, mkdirSync, rmSync, writeFileSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { artifactManifest, generateContracts } from './contracts'

describe('génération de contrats locaux', () => {
  it('refuse une génération vide et les sorties symboliques', () => {
    const root = mkdtempSync(join(tmpdir(), 'contracts-empty-'))
    try {
      expect(() => artifactManifest(root)).toThrow()
      symlinkSync('/tmp', join(root, 'external'))
      expect(() => artifactManifest(root)).toThrow()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
  it('refuse du YAML invalide sans promouvoir les artefacts', async () => {
    const root = mkdtempSync(join(tmpdir(), 'contracts-invalid-'))
    try {
      mkdirSync(join(root, 'source/webapp'), { recursive: true })
      writeFileSync(join(root, 'source/webapp/article.yaml'), 'type: [invalid')
      await expect(generateContracts(join(root, 'source'), join(root, 'output'))).rejects.toThrow()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
  it('compare le contenu et non la date des fichiers', () => {
    const root = mkdtempSync(join(tmpdir(), 'contracts-digest-'))
    try {
      writeFileSync(join(root, 'sample.ts'), 'export type Name = string')
      const before = artifactManifest(root)
      writeFileSync(join(root, 'sample.ts'), 'export type Name = number')
      expect(artifactManifest(root)).not.toEqual(before)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
