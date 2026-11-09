/**
 * @rule app/README.md — Sur-vérification des variables (warning)
 *
 * Détecte les gardes défensives résiduelles dans les fichiers Vue et TypeScript de app/ :
 *   - patterns littéraux dans le bloc script (`?? undefined`, `?? null`)
 *   - double-check de variable dans le template (`x && x.`)
 *
 * - app-no-redundant-guards : exit 0 (revue manuelle requise)
 */

import { readFileSync } from 'node:fs'
import { extname, relative } from 'node:path'

import { ROOT, listProjectFiles, loadValidationRule } from './validation-rules'

type GuardRule = {
  patterns?: string[]
  templateDoubleCheckRegex?: string
}

const RULE = loadValidationRule<GuardRule & { name: string; requiresManualReview: boolean }>(
  'app-no-redundant-guards',
)

const PATTERNS = RULE.patterns ?? ['?? undefined', '?? null']
const TEMPLATE_DOUBLE_CHECK_PATTERN = RULE.templateDoubleCheckRegex ?? '\\b(\\w+)\\s+&&\\s+\\1\\.'

type FilePath = string
type Violation = { file: FilePath; line: number; rule: string; message: string }

function extractBlock(
  content: string,
  tag: 'script' | 'template',
): { text: string; lineOffset: number } | null {
  const match = content.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  if (!match || match.index === undefined) return null
  const lineOffset =
    content.slice(0, match.index + match[0].indexOf(match[1])).split('\n').length - 1
  return { text: match[1], lineOffset }
}

export function checkFile(file: FilePath): Violation[] {
  let content: string
  try {
    content = readFileSync(file, 'utf-8')
  } catch {
    return []
  }

  const violations: Violation[] = []
  const isVue = extname(file) === '.vue'

  const scriptBlock = isVue ? extractBlock(content, 'script') : { text: content, lineOffset: 0 }
  if (scriptBlock) {
    scriptBlock.text.split('\n').forEach((line, idx) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return
      const lineNum = scriptBlock.lineOffset + idx + 1
      for (const pattern of PATTERNS) {
        if (line.includes(pattern)) {
          violations.push({
            file,
            line: lineNum,
            rule: 'app-no-redundant-guards',
            message: `pattern "${pattern}" — ${trimmed}`,
          })
        }
      }
    })
  }

  if (isVue) {
    const templateBlock = extractBlock(content, 'template')
    if (templateBlock) {
      const re = new RegExp(TEMPLATE_DOUBLE_CHECK_PATTERN)
      templateBlock.text.split('\n').forEach((line, idx) => {
        const trimmed = line.trim()
        if (trimmed.startsWith('<!--')) return
        const lineNum = templateBlock.lineOffset + idx + 1
        if (re.test(line)) {
          violations.push({
            file,
            line: lineNum,
            rule: 'app-no-redundant-guards',
            message: `double-check suspect — ${trimmed}`,
          })
        }
      })
    }
  }

  return violations
}

function rel(file: FilePath): string {
  return relative(ROOT, file)
}

function report(violations: Violation[]): void {
  if (violations.length === 0) {
    process.stdout.write('✓ Gardes redondantes OK\n')
    return
  }

  process.stderr.write(
    `\n⚠  ${violations.length} garde(s) redondante(s) suspecte(s) (revue manuelle requise)\n\n`,
  )
  for (const v of violations) {
    process.stderr.write(`  [${v.rule}] ${rel(v.file)}:${v.line}\n`)
    process.stderr.write(`  ${v.message}\n`)
    process.stderr.write(
      `  → affiner le type ou supprimer la vérification si le contrat le garantit\n\n`,
    )
  }
}

if (import.meta.main) {
  const files = listProjectFiles(['.ts', '.vue']).filter(
    (f) => relative(ROOT, f).startsWith('app/') && !f.startsWith(ROOT + '/scripts/'),
  )
  const violations = files.flatMap(checkFile)
  report(violations)
  process.exit(0)
}
