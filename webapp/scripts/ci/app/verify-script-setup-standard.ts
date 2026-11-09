/**
 * @rule docs/2.architecture/7.script-setup-standard.md
 * @see app/README.md — Convention : Structure interne de <script setup>
 *
 * Vérifie que chaque <script setup lang="ts"> contient les 12 commentaires de section
 * numérotés dans l'ordre croissant :
 *
 *   // 1. Imports
 *   // 2. Types et constantes statiques
 *   // 3. Props et emits
 *   // 4. Composables, stores, routeur
 *   // 5. Etat local
 *   // 6. Data inputs
 *   // 7. Validation et helpers purs
 *   // 8. Computed UI-ready
 *   // 9. Actions et handlers
 *   // 10. Watch et watchEffect
 *   // 11. Metadonnees ecran ou page
 *   // 12. Lifecycle
 *
 * Violations détectées :
 *   1. Commentaire(s) de section absent(s)
 *   2. Commentaire(s) de section dans le mauvais ordre
 *
 * Scope : app/components/, app/pages/, app/layouts/
 * Mode : erreur bloquante (exit 1)
 */

import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import { ROOT, listProjectFiles, loadValidationRule } from './validation-rules'

type ScriptSetupRule = {
  sectionCount?: number
  sectionPattern?: string
}

const RULE = loadValidationRule<ScriptSetupRule & { name: string; requiresManualReview: boolean }>(
  'app-script-setup-standard',
)
const SECTION_COUNT = RULE.sectionCount ?? 12

// Correspond à "// N. " en début de ligne (espaces avant autorisés)
const SECTION_PATTERN = new RegExp(RULE.sectionPattern ?? '^\\s*\\/\\/\\s*(\\d+)\\.\\s')

export type FilePath = string
// section number (1-12) → numéro de ligne dans le bloc script (1-based)
export type SectionMap = Map<number, number>
export type Violation = {
  file: FilePath
  line: number
  rule: 1 | 2
  message: string
}

export function collectVueFiles(): FilePath[] {
  const scopes = ['app/components/', 'app/pages/', 'app/layouts/']
  return listProjectFiles(['.vue']).filter((f) => scopes.some((s) => f.startsWith(join(ROOT, s))))
}

export function extractScriptBlock(content: string): { text: string; lineOffset: number } | null {
  const match =
    content.match(/<script\b[^>]*\bsetup\b[^>]*>([\s\S]*?)<\/script>/i) ??
    content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
  if (!match || match[1] === undefined || match.index === undefined) return null

  const headerLen = match[0].length - match[1].length - '</script>'.length
  const lineOffset = content.slice(0, match.index + headerLen).split('\n').length - 1
  return { text: match[1], lineOffset }
}

export function scanSections(script: string): SectionMap {
  const sections: SectionMap = new Map()
  const lines = script.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i]!.match(SECTION_PATTERN)
    if (!match) continue
    const num = parseInt(match[1]!, 10)
    if (num >= 1 && num <= SECTION_COUNT && !sections.has(num)) {
      sections.set(num, i + 1)
    }
  }

  return sections
}

export function findViolations(
  sections: SectionMap,
  lineOffset: number,
  file: FilePath,
): Violation[] {
  const violations: Violation[] = []

  // Règle 1 — sections manquantes
  const missing = Array.from({ length: SECTION_COUNT }, (_, i) => i + 1).filter(
    (n) => !sections.has(n),
  )
  if (missing.length > 0) {
    violations.push({
      file,
      rule: 1,
      line: lineOffset + 1,
      message: `commentaires de section absents : ${missing.map((n) => `// ${n}.`).join(', ')}`,
    })
  }

  // Règle 2 — sections dans le mauvais ordre (parcourir par ordre d'apparition dans le fichier)
  const byLine = [...sections.entries()].sort((a, b) => a[1] - b[1])
  let lastNum = 0
  for (const [num, scriptLine] of byLine) {
    if (num < lastNum) {
      violations.push({
        file,
        rule: 2,
        line: lineOffset + scriptLine,
        message: `// ${num}. apparaît après // ${lastNum}. — les sections doivent être dans l'ordre croissant`,
      })
    } else {
      lastNum = num
    }
  }

  return violations
}

export function checkFile(file: FilePath): Violation[] {
  let content: string
  try {
    content = readFileSync(file, 'utf-8')
  } catch {
    return []
  }

  const block = extractScriptBlock(content)
  if (!block) return []

  const sections = scanSections(block.text)
  return findViolations(sections, block.lineOffset, file)
}

function rel(file: FilePath): string {
  return relative(ROOT, file)
}

function report(violations: Violation[]): void {
  if (violations.length === 0) {
    process.stdout.write('✓ Script setup structure OK\n')
    return
  }

  process.stderr.write(
    `\n✗ ${violations.length} violation(s) de structure script setup détectée(s)\n\n`,
  )
  for (const v of violations) {
    process.stderr.write(`  [règle ${v.rule}] ${rel(v.file)}:${v.line}\n`)
    process.stderr.write(`  ${v.message}\n\n`)
  }
}

if (import.meta.main) {
  const files = collectVueFiles()
  const violations = files.flatMap(checkFile)
  report(violations)
  process.exit(violations.length > 0 ? 1 : 0)
}
