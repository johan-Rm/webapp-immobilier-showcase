import { createHash } from 'node:crypto'
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { generateArtifacts } from '../../services/converter/schema/generateArtifacts'

export function artifactManifest(root: string): Record<string, string> {
  const files: Record<string, string> = {}
  const walk = (directory: string) => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name),
        stat = lstatSync(path)
      if (stat.isSymbolicLink()) throw new Error('Artefact symbolique refusé')
      if (stat.isDirectory()) walk(path)
      else if (stat.isFile())
        files[relative(root, path)] = createHash('sha256').update(readFileSync(path)).digest('hex')
    }
  }
  walk(root)
  if (!Object.keys(files).length) throw new Error('Aucun artefact généré')
  return files
}
export async function generateContracts(source: string, output: string) {
  const sourceStat = lstatSync(source)
  if (sourceStat.isSymbolicLink() || !sourceStat.isDirectory())
    throw new Error('Source locale régulière requise')
  for (const [folder, suffix] of [
    ['webapp', ''],
    ['dtos/symfony_api', 'Dto'],
  ] as const) {
    const directory = join(source, folder)
    if (lstatSync(directory).isSymbolicLink()) throw new Error('Source symbolique refusée')
    const files = readdirSync(directory)
      .filter((name) => name.endsWith('.yaml'))
      .sort()
    if (!files.length) throw new Error('Aucun schéma YAML local')
    for (const name of files)
      if (
        !lstatSync(join(directory, name)).isFile() ||
        lstatSync(join(directory, name)).isSymbolicLink()
      )
        throw new Error('Schéma non régulier')
    const names = files.map((name) =>
      name
        .replace(/\.yaml$/, '')
        .replace(/(?:^|_)([a-z])/g, (_, letter: string) => letter.toUpperCase()),
    )
    await generateArtifacts(directory, names, names, {
      outputDir: join(output, suffix ? 'dtos' : 'interfaces'),
      typeNameSuffix: suffix,
    })
  }
  return artifactManifest(output)
}
export async function runContracts(
  root = resolve(dirname(fileURLToPath(import.meta.url)), '../..'),
) {
  const temporary = mkdtempSync(join(tmpdir(), 'nuxt-contracts-'))
  try {
    const source = join(root, 'schemas/source'),
      before = artifactManifest(source)
    const first = await generateContracts(source, join(temporary, 'first')),
      second = await generateContracts(source, join(temporary, 'second'))
    if (JSON.stringify(first) !== JSON.stringify(second))
      throw new Error('Génération non déterministe')
    if (JSON.stringify(before) !== JSON.stringify(artifactManifest(source)))
      throw new Error('Sources modifiées')
    const directory = join(root, '.tmp/quality')
    mkdirSync(directory, { recursive: true })
    const report = {
      source: 'YAML locaux versionnés',
      externalApiVerified: false,
      files: first,
      count: Object.keys(first).length,
      deterministic: true,
    }
    writeFileSync(join(directory, 'contracts.json'), JSON.stringify(report, null, 2) + '\n')
    process.stdout.write(
      `Contrats : ${report.count} artefacts identiques sur deux générations ; API externe non vérifiée.\nRapport : ${join(directory, 'contracts.json')}\n`,
    )
    return report
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
}
if (import.meta.main)
  runContracts().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
