import { relative } from 'node:path'

import { parse as parseScript } from '@typescript-eslint/parser'
import { parse as parseVue } from '@vue/compiler-sfc'

import { frontendAppRoot, frontendRelativePath, loadValidationRule } from './validation-rules'

export type Finding = {
  severity: 'error' | 'warning' | 'exemption'
  rule: string
  line: number
  message: string
}

type VueNode = {
  type: number
  tag?: string
  tagType?: number
  content?: string
  loc?: { start: { line: number; offset: number } }
  props?: VueProp[]
  children?: VueNode[]
}
type VueProp = {
  type: number
  name: string
  value?: { content: string }
  arg?: { content?: string; isStatic?: boolean }
  exp?: { content?: string }
}
type ScriptNode = {
  type?: string
  name?: string
  value?: unknown
  source?: { value?: unknown }
  importKind?: string
  callee?: ScriptNode
  property?: ScriptNode
  computed?: boolean
  loc?: { start: { line: number } }
  [key: string]: unknown
}

type StrictPolicy = {
  name: string
  requiresManualReview: boolean
  scriptLanguage: string
  requiredRegionTags: string[]
  directRegionTags: string[]
  wrappers: { module: string; component: string }[]
}
type ReviewPolicy = {
  name: string
  requiresManualReview: boolean
  transforms: string[]
  textAttributes: string[]
  editorialTags: string[]
  historyPattern: string
}

export function loadFrontendPolicy() {
  return {
    strict: loadValidationRule<StrictPolicy>('frontend-vue-policy'),
    review: loadValidationRule<ReviewPolicy>('frontend-review-policy'),
  }
}

function walkScript(node: unknown, visit: (node: ScriptNode) => void): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    node.forEach((entry) => walkScript(entry, visit))
    return
  }
  const current = node as ScriptNode
  if (current.type) visit(current)
  for (const [key, value] of Object.entries(current)) {
    if (!['loc', 'range', 'tokens', 'comments', 'parent'].includes(key)) walkScript(value, visit)
  }
}

function slug(path: string): string {
  return path
    .replace(/\.vue$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/\[|\]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function directive(node: VueNode, name: string): boolean {
  return Boolean(node.props?.some((prop) => prop.type === 7 && prop.name === name))
}

function marker(node: VueNode, name: string): { present: boolean; value?: string } {
  const direct = node.props?.find((prop) => prop.type === 6 && prop.name === name)
  const bound = node.props?.find(
    (prop) => prop.type === 7 && prop.name === 'bind' && prop.arg?.content === name,
  )
  return { present: Boolean(direct || bound), value: bound ? undefined : direct?.value?.content }
}

export function analyzeScriptSource(
  content: string,
  file: string,
  root: string,
  lineOffset = 0,
  policy = loadFrontendPolicy(),
): Finding[] {
  const findings: Finding[] = []
  const report = (severity: Finding['severity'], rule: string, line: number, message: string) => {
    findings.push({ severity, rule, line, message })
  }
  try {
    const ast = parseScript(content, {
      sourceType: 'module',
      ecmaVersion: 'latest',
      loc: true,
      comment: true,
    })
    walkScript(ast, (node) => {
      const line = lineOffset + 1 + (node.loc?.start.line ?? 1) - 1
      if (
        node.type === 'CallExpression' &&
        ((node.callee?.type === 'MemberExpression' &&
          (node.callee.property?.name === 'addEventListener' ||
            node.callee.property?.value === 'addEventListener')) ||
          node.callee?.name === 'addEventListener')
      ) {
        report(
          'warning',
          'direct-dom-event',
          line,
          'Écouteur DOM direct : vérifier le besoin, le nettoyage et l’alternative VueUse.',
        )
      }
      let module: unknown
      if (node.type === 'ImportDeclaration' && node.importKind !== 'type') {
        const specifiers = node.specifiers as ScriptNode[]
        if (!specifiers?.length || specifiers.some((specifier) => specifier.importKind !== 'type'))
          module = node.source?.value
      }
      if (node.type === 'ImportExpression') {
        module = (node.source as ScriptNode)?.value
        if (typeof module !== 'string')
          report(
            'warning',
            'dynamic-import-review',
            line,
            'Import dynamique non littéral : encapsulation à vérifier humainement.',
          )
      }
      if (
        ['ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type ?? '') &&
        node.exportKind !== 'type'
      )
        module = node.source?.value
      if (node.type === 'CallExpression' && node.callee?.name === 'require')
        module = (node.arguments as ScriptNode[])?.[0]?.value
      if (typeof module !== 'string') return
      for (const wrapper of policy.strict.wrappers) {
        if (module !== wrapper.module && !module.startsWith(wrapper.module + '/')) continue
        if (!(
          frontendAppRoot(file, root) &&
          frontendRelativePath(file, root) === `components/${wrapper.component}`
        )) {
          report(
            'error',
            'declared-module-wrapper',
            line,
            `Module ${module} réservé à son encapsulation déclarée.`,
          )
        }
      }
    })
    for (const comment of ast.comments ?? []) {
      if (new RegExp(policy.review.historyPattern, 'i').test(comment.value)) {
        report(
          'warning',
          'historical-comment',
          lineOffset + 1 + (comment.loc?.start.line ?? 1) - 1,
          'Référence historique dans un commentaire : vérifier sa place dans Git ou le dev-book.',
        )
      }
    }
  } catch (error) {
    report(
      'error',
      'script-parse',
      lineOffset + 1,
      `Analyse TypeScript impossible : ${String(error)}`,
    )
  }
  return findings
}

export function analyzeVue(
  source: string,
  file: string,
  root: string,
  policy = loadFrontendPolicy(),
): Finding[] {
  const findings: Finding[] = []
  const report = (severity: Finding['severity'], rule: string, line: number, message: string) => {
    findings.push({ severity, rule, line, message })
  }
  const { descriptor, errors } = parseVue(source, { filename: file })
  for (const error of errors) {
    report('error', 'vue-parse', 1, typeof error === 'string' ? error : error.message)
  }
  if (errors.length) return findings
  const blocks = [
    descriptor.template,
    descriptor.script,
    descriptor.scriptSetup,
    ...descriptor.styles,
  ]
    .filter((block) => block !== null)
    .sort((a, b) => a.loc.start.offset - b.loc.start.offset)
  const ranks = blocks.map((block) => {
    if (block.type === 'template') return 0
    if (block.type === 'script') return 1
    return 2
  })
  if (ranks.some((rank, i) => i > 0 && rank < ranks[i - 1]!)) {
    report(
      'error',
      'vue-block-order',
      1,
      'Ordre requis : template, script setup TypeScript, style.',
    )
  }
  for (const script of [descriptor.script, descriptor.scriptSetup]) {
    if (!script) continue
    if (!script.setup || script.lang !== policy.strict.scriptLanguage || script.src) {
      report(
        'error',
        'vue-script-contract',
        script.loc.start.line,
        'Un script présent doit être setup, TypeScript et local.',
      )
    }
    findings.push(
      ...analyzeScriptSource(script.content, file, root, script.loc.start.line - 1, policy),
    )
  }

  const template = descriptor.template
  if (!template) return findings
  if ((template.lang && template.lang !== 'html') || !template.ast) {
    report(
      'error',
      'template-parse',
      template.loc.start.line,
      'Template non analysable par le parseur HTML Vue ; aucune conformité établie.',
    )
    return findings
  }
  const ast = template.ast as unknown as VueNode
  const roots = (ast?.children ?? []).filter(
    (node) => node.type !== 3 && !(node.type === 2 && !node.content?.trim()),
  )
  const local = frontendRelativePath(file, root)
  const category = local?.split('/')[0]
  const isPage = category === 'pages'
  const isLayout = category === 'layouts'
  const isComponent = category === 'components'
  const rootNode = roots.length === 1 && roots[0]?.type === 1 ? roots[0] : undefined
  const eligible =
    rootNode &&
    rootNode.tagType === 0 &&
    !['if', 'else-if', 'else', 'for'].some((name) => directive(rootNode, name))
  if (isPage || isLayout || (isComponent && eligible)) {
    let name = 'data-component'
    if (isPage) name = 'data-page'
    else if (isLayout) name = 'data-layout'
    const expected = slug(local!.split('/').slice(1).join('/'))
    const actual = rootNode && marker(rootNode, name)
    if (!actual?.present || actual.value !== expected) {
      report(
        'error',
        'root-marker',
        rootNode?.loc?.start.line ?? template.loc.start.line,
        `${name} statique attendu : ${expected}.`,
      )
    }
  } else if (isComponent) {
    report(
      'exemption',
      'root-marker-exemption',
      template.loc.start.line,
      'Racine multiple, conditionnelle ou composant Vue : marqueur de composant non exigé.',
    )
  }
  const sections = new Set<string>()
  let mains = 0
  let indirectStructure = false
  const expressions = (expression: string, line: number, userFacing = false) => {
    if (userFacing && /^([\'"`]).*\1$/s.test(expression.trim())) {
      report(
        'warning',
        'untranslated-expression',
        line,
        'Texte littéral affiché : vérifier la traduction.',
      )
    }
    try {
      const parsed = parseScript(`(${expression})`, { sourceType: 'module', ecmaVersion: 'latest' })
      walkScript(parsed, (node) => {
        if (
          node.type === 'CallExpression' &&
          node.callee?.type === 'MemberExpression' &&
          policy.review.transforms.includes(node.callee.property?.name ?? '')
        ) {
          report(
            'warning',
            'template-transformation',
            line,
            'Transformation dans le template : vérifier sa préparation en amont.',
          )
        }
      })
    } catch {
      report(
        'warning',
        'template-expression-review',
        line,
        'Expression Vue non analysée : relecture nécessaire.',
      )
    }
  }
  const visit = (node: VueNode, depth = 0, repeated = false, editorial = false) => {
    const line = node.loc?.start.line ?? template.loc.start.line
    const loop = repeated || directive(node, 'for')
    const content = editorial || policy.review.editorialTags.includes(node.tag ?? '')
    if (!editorial && policy.review.editorialTags.includes(node.tag ?? '')) {
      report(
        'exemption',
        'editorial-content-exemption',
        line,
        'Contenu éditorial : traduction supposée assurée en amont, à vérifier humainement.',
      )
    }
    if (node.type === 1) {
      if (node.tag === 'main') mains += 1
      if (node.tagType === 1 || node.tag === 'slot') indirectStructure = true
      const section = marker(node, 'data-section')
      if (section.present) {
        if (
          !section.value ||
          !/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(section.value) ||
          sections.has(section.value) ||
          loop
        ) {
          report(
            'error',
            'section-marker',
            line,
            'data-section doit être statique, en kebab-case, unique et hors boucle dans ce modèle.',
          )
        }
        if (section.value) sections.add(section.value)
      }
      const stable = !loop && !['if', 'else-if', 'else'].some((name) => directive(node, name))
      const screen = isComponent && /^components\/screen\//.test(local ?? '') && depth === 0
      const directRegion =
        (isPage || isLayout) &&
        depth <= 1 &&
        policy.strict.directRegionTags.includes(node.tag ?? '')
      if (
        stable &&
        (policy.strict.requiredRegionTags.includes(node.tag ?? '') || screen || directRegion) &&
        node.tagType === 0 &&
        !section.present
      ) {
        report('error', 'required-section', line, 'Région sémantique stable : data-section requis.')
      }
      for (const prop of node.props ?? []) {
        if (
          prop.type === 7 &&
          prop.exp?.content &&
          ['bind', 'if', 'else-if', 'show'].includes(prop.name)
        ) {
          expressions(
            prop.exp.content,
            line,
            policy.review.textAttributes.includes(prop.arg?.content ?? '') && !content,
          )
        }
        if (prop.type === 7 && prop.name === 'for' && prop.exp?.content) {
          expressions(
            prop.exp.content
              .split(/\s+(?:in|of)\s+/)
              .slice(1)
              .join(' in '),
            line,
          )
        }
        if (
          prop.type === 6 &&
          policy.review.textAttributes.includes(prop.name) &&
          prop.value?.content &&
          !content
        ) {
          report(
            'warning',
            'untranslated-attribute',
            line,
            `Texte ${prop.name} statique : vérifier la traduction ou sa provenance éditoriale.`,
          )
        }
      }
    }
    if (node.type === 3 && new RegExp(policy.review.historyPattern, 'i').test(node.content ?? '')) {
      report('warning', 'historical-comment', line, 'Commentaire historique de template à relire.')
    }
    if (node.type === 2 && /\p{L}/u.test(node.content ?? '') && !content) {
      report(
        'warning',
        'untranslated-text',
        line,
        'Texte visible statique : vérifier la traduction ou sa provenance éditoriale.',
      )
    }
    if (node.type === 5) {
      const interpolation = node as unknown as { content?: { content?: string } }
      expressions(interpolation.content?.content ?? '', line, !content)
    }
    for (const child of node.children ?? []) visit(child, depth + 1, loop, content)
  }
  roots.forEach((node) => visit(node))
  if ((isPage || /^components\/screen\//.test(local ?? '')) && mains) {
    report(
      'error',
      'main-owner',
      template.loc.start.line,
      'Le repère main appartient au layout, pas à une page ou un Screen.',
    )
  }
  if (isLayout && mains !== 1) {
    report(
      mains === 0 && indirectStructure ? 'warning' : 'error',
      'main-count',
      template.loc.start.line,
      'Un layout possède exactement un main dans sa source ; le rendu final nécessite aussi un test navigateur.',
    )
  }
  return findings
}

export function relativeFrontendName(file: string, root: string): string {
  return relative(root, file).replaceAll('\\', '/')
}

export function policyExitCode(findings: Finding[]): number {
  return findings.some((finding) => finding.severity === 'error') ? 1 : 0
}

export function analyzeLayerConfig(source: string, file: string, root: string): Finding[] {
  const findings: Finding[] = []
  const relative = relativeFrontendName(file, root)
  const isRoot = relative === 'nuxt.config.ts'
  const isBase = relative.startsWith('base/')
  if (!isRoot && !isBase) return findings
  const fail = (rule: string, message: string, line = 1) => {
    findings.push({ severity: 'error', rule, line, message })
  }
  try {
    const ast = parseScript(source, { sourceType: 'module', ecmaVersion: 'latest', loc: true })
    let config: ScriptNode | undefined
    walkScript(ast, (node) => {
      if (node.type === 'ExportDefaultDeclaration') {
        const call = node.declaration as ScriptNode
        if (call?.type === 'CallExpression' && call.callee?.name === 'defineNuxtConfig') {
          config = (call.arguments as ScriptNode[])?.[0]
        }
      }
      if (
        isBase &&
        node.type === 'CallExpression' &&
        node.callee?.name === 'resolveApplicationTarget'
      ) {
        fail(
          'layer-client-selection',
          'Une layer du socle ne sélectionne pas une application cliente.',
        )
      }
    })
    if (config?.type !== 'ObjectExpression') {
      fail(
        'layer-config',
        'Configuration Nuxt non analysable statiquement : objet explicite requis.',
      )
      return findings
    }
    const definitions = new Map<string, unknown>()
    for (const statement of ast.body) {
      if (statement.type !== 'VariableDeclaration') continue
      for (const declaration of statement.declarations) {
        if (declaration.id.type === 'Identifier')
          definitions.set(declaration.id.name, declaration.init)
      }
    }
    const inspectResolved = (
      value: unknown,
      visit: (node: ScriptNode) => void,
      seen = new Set<string>(),
    ): void => {
      walkScript(value, (node) => {
        visit(node)
        if (
          node.type === 'Identifier' &&
          node.name &&
          definitions.has(node.name) &&
          !seen.has(node.name)
        ) {
          seen.add(node.name)
          inspectResolved(definitions.get(node.name), visit, seen)
        }
      })
    }
    const properties = config.properties as ScriptNode[]
    const property = (name: string) =>
      properties.find(
        (node) =>
          (node.key as ScriptNode)?.name === name || (node.key as ScriptNode)?.value === name,
      )
    if (!property('srcDir'))
      fail('layer-sources', 'La configuration déclare explicitement ses sources avec srcDir.')
    for (const name of ['extends', 'srcDir']) {
      const value = property(name)?.value
      inspectResolved(value, (node) => {
        if (node.type !== 'Literal' || typeof node.value !== 'string') return
        const path = node.value.replaceAll('\\', '/').replace(/\/$/, '')
        if (isRoot && name === 'extends' && /^(?:\.\/|~\/|@\/)?base$/.test(path)) {
          fail('global-base-extension', 'Le catalogue base ne doit pas être étendu globalement.')
        }
        if (isBase && /(?:^|\/)sites(?:\/|$)|dashboard\/app/.test(path)) {
          fail(
            'layer-client-selection',
            'Une layer du socle ne dépend pas des sources d’un client.',
          )
        }
      })
    }
    if (isRoot) {
      let selectsTarget = false
      inspectResolved(property('srcDir')?.value, (node) => {
        if (node.type === 'CallExpression' && node.callee?.name === 'resolveApplicationTarget')
          selectsTarget = true
        if (
          node.type === 'MemberExpression' &&
          (node.property?.name === 'GD_TARGET' || node.property?.value === 'GD_TARGET')
        )
          selectsTarget = true
      })
      if (!selectsTarget)
        fail(
          'explicit-application',
          'La racine sélectionne explicitement sa cible par le résolveur du projet.',
        )
    }
  } catch (error) {
    fail('layer-parse', `Analyse statique impossible : ${String(error)}`)
  }
  return findings
}
