/**
 * @rule app/README.md — Convention : Images
 *
 * Vérifie que toutes les images dans app/ passent par <AppImage>
 * avec un preset via v-bind — pas de balises brutes ni de props image en dur.
 *
 * Violations détectées :
 *   1. <img>, <NuxtImg>, <NuxtPicture> en dehors de app/components/AppImage.vue
 *   2. <AppImage> avec des props image écrites en dur (:width, :format, :quality, :fit, :sizes)
 *      au lieu de v-bind="IMAGE_PRESETS.xxx" ou v-bind="IMAGE_WARMUP_PRESETS.xxx"
 *   3. <AppImage> avec une prop height explicite
 */

import { readFileSync } from 'node:fs'
import { relative } from 'node:path'

import { ROOT, listProjectFiles, loadValidationRule, projectPaths } from './validation-rules'

type AppImageRule = {
  allowedFiles?: string[]
  forbiddenTags?: string[]
  inlineImageProps?: string[]
}

type NoHeightPropRule = {
  forbiddenProps?: string[]
}

const RULE = loadValidationRule<AppImageRule & { name: string; requiresManualReview: boolean }>(
  'app-images-use-app-image',
)
const NO_HEIGHT_RULE = loadValidationRule<
  NoHeightPropRule & { name: string; requiresManualReview: boolean }
>('app-images-no-height-prop')
const ALLOWED_FILES = new Set(projectPaths(RULE.allowedFiles ?? ['app/components/AppImage.vue']))

const FORBIDDEN_TAGS = RULE.forbiddenTags ?? ['img', 'NuxtImg', 'NuxtPicture']
const INLINE_IMAGE_PROPS = RULE.inlineImageProps ?? [
  ':width=',
  ':height=',
  ':format=',
  ':quality=',
  ':fit=',
  ':sizes=',
]
const FORBIDDEN_IMAGE_PROPS = NO_HEIGHT_RULE.forbiddenProps ?? ['height']

export type FilePath = string
export type Violation = {
  file: FilePath
  line: number
  rule: 1 | 2 | 3
  message: string
}

function hasVueProp(block: string, prop: string): boolean {
  const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|\\s):?${escaped}\\s*=`, 'm').test(block)
}

export function collectVueFiles(): FilePath[] {
  return listProjectFiles(['.vue']).filter((f) => relative(ROOT, f).startsWith('app/'))
}

export function extractTemplate(content: string): { text: string; offset: number } | null {
  const match = content.match(/<template>([\s\S]*?)<\/template>/)
  if (!match || match.index === undefined) return null
  return {
    text: match[1],
    offset: match.index + '<template>'.length,
  }
}

export function lineAt(content: string, index: number): number {
  return content.slice(0, index).split('\n').length
}

export function checkFile(file: FilePath): Violation[] {
  const violations: Violation[] = []

  let content: string
  try {
    content = readFileSync(file, 'utf-8')
  } catch {
    return violations
  }

  const tpl = extractTemplate(content)
  if (!tpl) return violations
  const { text: template, offset } = tpl

  // Règle 1 — balises image brutes interdites (sauf AppImage.vue qui wrap NuxtImg)
  if (!ALLOWED_FILES.has(file)) {
    for (const tag of FORBIDDEN_TAGS) {
      const regex = new RegExp(`<${tag}\\b`, 'g')
      let match: RegExpExecArray | null
      while ((match = regex.exec(template)) !== null) {
        violations.push({
          file,
          line: lineAt(content, offset + match.index),
          rule: 1,
          message: `<${tag}> interdit — utiliser <AppImage> avec un preset`,
        })
      }
    }
  }

  // Règle 2 — <AppImage> avec props image écrites en dur
  const appImageRegex = /<AppImage\b([\s\S]*?)(?:\/?>)/g
  let match: RegExpExecArray | null
  while ((match = appImageRegex.exec(template)) !== null) {
    const block = match[1]
    const inlineProps = INLINE_IMAGE_PROPS.filter((prop) => block.includes(prop))
    if (inlineProps.length > 0) {
      violations.push({
        file,
        line: lineAt(content, offset + match.index),
        rule: 2,
        message: `<AppImage> avec props en dur (${inlineProps.join(', ')}) — utiliser v-bind="IMAGE_PRESETS.xxx"`,
      })
    }

    const forbiddenProps = FORBIDDEN_IMAGE_PROPS.filter((prop) => hasVueProp(block, prop))
    if (forbiddenProps.length > 0) {
      violations.push({
        file,
        line: lineAt(content, offset + match.index),
        rule: 3,
        message: `<AppImage> avec prop interdite (${forbiddenProps.join(', ')}) — ne pas déclarer height dans le template`,
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
    process.stdout.write('✓ Images OK\n')
    return
  }

  process.stderr.write(`\n✗ ${violations.length} violation(s) images détectée(s)\n\n`)
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
