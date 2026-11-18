import { createHash } from 'node:crypto'

import { parse } from '@vue/compiler-sfc'
import ts from 'typescript'

export type Finding = {
  rule: 'function-length' | 'function-complexity' | 'debugger' | 'debug-log'
  line: number
  value?: number
}

const branches = new Set([
  ts.SyntaxKind.IfStatement,
  ts.SyntaxKind.ForStatement,
  ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement,
  ts.SyntaxKind.WhileStatement,
  ts.SyntaxKind.DoStatement,
  ts.SyntaxKind.CaseClause,
  ts.SyntaxKind.CatchClause,
  ts.SyntaxKind.ConditionalExpression,
])
const operators = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
])

export function inspectSource(path: string, content: string): Finding[] {
  let parts = [{ content, line: 1 }]
  if (path.endsWith('.vue')) {
    const parsed = parse(content, { filename: path })
    if (parsed.errors.length) throw new Error(`Vue invalide : ${path}`)
    parts = [parsed.descriptor.script, parsed.descriptor.scriptSetup]
      .filter((part): part is NonNullable<typeof part> => Boolean(part))
      .map((part) => ({ content: part.content, line: part.loc.start.line }))
  }
  const findings: Finding[] = []
  for (const part of parts) {
    const file = ts.createSourceFile(
      path,
      part.content,
      ts.ScriptTarget.Latest,
      true,
      path.endsWith('.tsx') || path.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    )
    const errors = (file as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] })
      .parseDiagnostics
    if (errors.length) throw new Error(`Source invalide : ${path}`)
    const lineOf = (position: number) =>
      part.line + file.getLineAndCharacterOfPosition(position).line
    const visit = (node: ts.Node) => {
      const line = lineOf(node.getStart(file))
      if (node.kind === ts.SyntaxKind.DebuggerStatement) findings.push({ rule: 'debugger', line })
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.expression.getText(file) === 'console' &&
        ['log', 'debug', 'info', 'warn', 'error'].includes(node.expression.name.text) &&
        /\b(?:request|response|payload|body|data|req|res)\b/i.test(
          node.arguments.map((arg) => arg.getText(file)).join(' '),
        )
      )
        findings.push({ rule: 'debug-log', line })
      if (ts.isFunctionLike(node) && 'body' in node && node.body) {
        const length = lineOf(node.end) - line + 1
        let complexity = 1
        const count = (child: ts.Node) => {
          if (child !== node && ts.isFunctionLike(child)) return
          if (branches.has(child.kind)) complexity++
          if (ts.isBinaryExpression(child) && operators.has(child.operatorToken.kind)) complexity++
          ts.forEachChild(child, count)
        }
        count(node)
        if (length > 50) findings.push({ rule: 'function-length', line, value: length })
        if (complexity > 10) findings.push({ rule: 'function-complexity', line, value: complexity })
      }
      ts.forEachChild(node, visit)
    }
    visit(file)
  }
  return findings
}

export type DebuggerException = {
  path: string
  line: number
  sha256: string
  reason: string
  approval: string
  expires: string
}

export function applyExceptions(
  sources: Record<string, string>,
  exceptions: DebuggerException[],
  today: string,
) {
  const findings = Object.entries(sources).flatMap(([path, content]) =>
    inspectSource(path, content).map((finding) => ({ path, ...finding })),
  )
  const seen = new Set<string>()
  const accepted = new Set<string>()
  for (const item of exceptions) {
    const key = `${item.path}:${item.line}`
    const validDate =
      /^\d{4}-\d{2}-\d{2}$/.test(item.expires) &&
      !Number.isNaN(Date.parse(`${item.expires}T00:00:00Z`)) &&
      new Date(`${item.expires}T00:00:00Z`).toISOString().startsWith(item.expires)
    if (
      seen.has(key) ||
      !Number.isInteger(item.line) ||
      item.line < 1 ||
      !item.reason?.trim() ||
      !item.approval?.trim() ||
      !validDate ||
      item.expires < today ||
      !/^[a-f0-9]{64}$/.test(item.sha256) ||
      !(item.path in sources) ||
      createHash('sha256').update(sources[item.path]).digest('hex') !== item.sha256 ||
      findings.filter(
        (finding) =>
          finding.path === item.path && finding.line === item.line && finding.rule === 'debugger',
      ).length !== 1
    )
      throw new Error(`Exception debugger invalide : ${key}`)
    seen.add(key)
    accepted.add(key)
  }
  return {
    findings,
    exceptions: [...accepted],
    blocking: findings.filter(
      (finding) => finding.rule === 'debugger' && !accepted.has(`${finding.path}:${finding.line}`),
    ),
  }
}
