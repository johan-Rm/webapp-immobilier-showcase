import { spawn } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { buildPlan, executePlan, isIntegration, parseOptions, webappRoot } from './run'

const temporary: string[] = []
afterEach(() =>
  temporary.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })),
)

describe('commande de vérification', () => {
  it.each([
    ['showcase-immobilier', ['tests/e2e/home.smoke.spec.ts']],
    [
      'client2-immobilier',
      ['tests/e2e/client2-articles.spec.ts', 'tests/e2e/client2.smoke.spec.ts'],
    ],
    ['dashboard', ['tests/e2e/saas-access.spec.ts', 'tests/e2e/saas-editor.spec.ts']],
  ])('liste les parcours de %s sans démarrer de navigateur', (target, files) => {
    const plan = buildPlan(parseOptions(['browser', '--target', target as string, '--list']))
    expect(plan.files).toEqual(files)
    expect(plan.commands[0]!.executable).toBe('node')
  })

  it.each([
    [],
    ['unknown'],
    ['unit', '--target', '../outside'],
    ['unit', '--target'],
    ['unit', '--unknown'],
    ['unit', '--profile', 'mobile'],
    ['lighthouse', '--profile', 'unknown'],
  ])('refuse les arguments ambigus : %j', (...args) => {
    expect(() => parseOptions(args)).toThrow()
  })

  it('découvre les suites Bun séparément de Vitest et ne divulgue pas l’environnement', () => {
    const plan = buildPlan(parseOptions(['unit', '--target', 'dashboard', '--list']))
    expect(plan.files).toContain('server/utils/auth/symfonyProjectMember.test.ts')
    expect(plan.commands.some((command) => command.args.includes('test'))).toBe(true)
    expect(
      plan.commands
        .filter((command) => command.args.some((arg) => arg.includes('vitest.mjs')))
        .every((command) => command.args.every((arg) => !arg.endsWith('.test.ts'))),
    ).toBe(true)
    for (const command of plan.commands)
      expect(Object.keys(command.env).sort()).toEqual(['GD_TARGET', 'VERIFY_FAMILY'])
  })

  it('sépare la logique pure des suites avec infrastructure', () => {
    expect(isIntegration('shared/example.vitest.ts', 'const value = 1')).toBe(false)
    expect(
      isIntegration('services/example.vitest.ts', 'import { createServer } from "node:http"'),
    ).toBe(true)
    expect(isIntegration('tests/layers/example.vitest.ts', '')).toBe(true)
    const plan = buildPlan(parseOptions(['integration', '--target', 'dashboard']))
    expect(plan.files).toContain('server/tests/saas-auth.vitest.ts')
    expect(plan.files).not.toContain('server/utils/auth/symfonyProjectMember.test.ts')
  })

  it('refuse une famille absente et un pilote vide sans démarrer Nuxt', () => {
    const root = mkdtempSync(join(tmpdir(), 'verify-empty-'))
    temporary.push(root)
    expect(() => buildPlan(parseOptions(['security']), root, [])).toThrow('non installée')
    expect(() => buildPlan(parseOptions(['unit']), root, [])).toThrow('Aucun test découvert')
    expect(() => buildPlan(parseOptions(['components']), webappRoot)).toThrow('non installé')
  })

  it('ne laisse pas une commande échouée devenir un succès', async () => {
    const root = mkdtempSync(join(tmpdir(), 'verify-process-'))
    temporary.push(root)
    const later = join(root, 'must-not-exist')
    const command = (script: string) => ({
      executable: process.execPath,
      args: ['-e', script],
      cwd: root,
      env: {},
    })
    const code = await executePlan({
      family: 'unit',
      target: 'dashboard',
      files: ['fixture'],
      commands: [
        command('process.exit(7)'),
        command(`require('node:fs').writeFileSync(${JSON.stringify(later)}, 'unexpected')`),
      ],
    })
    expect(code).toBe(7)
    expect(() => rmSync(later)).toThrow()
  })

  it('interrompt le processus possédé et retourne un code non réussi', async () => {
    const root = mkdtempSync(join(tmpdir(), 'verify-interrupt-'))
    temporary.push(root)
    mkdirSync(join(root, 'scripts/quality'), { recursive: true })
    writeFileSync(
      join(root, 'probe.mjs'),
      `import { executePlan } from ${JSON.stringify(join(webappRoot, 'scripts/quality/run.ts'))};
       const command = { executable: process.execPath, args: ['-e',
         'console.log("READY"); setInterval(() => {}, 1000)'], cwd: process.cwd(), env: {} };
       process.exitCode = await executePlan({family:'unit', target:'dashboard', files:['fixture'], commands:[command]});`,
    )
    const child = spawn('bun', [join(root, 'probe.mjs')], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const result = await new Promise<number | null>((complete, reject) => {
      const timer = setTimeout(() => {
        child.kill('SIGKILL')
        reject(new Error('Processus de test non interrompu'))
      }, 5000)
      let output = ''
      let signaled = false
      child.stdout.on('data', (chunk) => {
        output += String(chunk)
        if (!signaled && output.includes('READY')) {
          signaled = true
          child.kill('SIGINT')
        }
      })
      child.once('error', reject)
      child.once('exit', (code) => {
        clearTimeout(timer)
        complete(code)
      })
    })
    expect(result).toBe(130)
  })
})

it('interdit le chargement implicite de dotenv par les sous-processus Bun', () => {
  for (const family of [
    'unit',
    'conventions',
    'security',
    'architecture',
    'mutation',
    'load',
    'lighthouse',
    'contracts',
  ] as const) {
    const plan = buildPlan({
      family,
      target: 'dashboard',
      list: true,
      ...(family === 'lighthouse' ? { profile: 'desktop' } : {}),
    })
    for (const command of plan.commands.filter((command) => command.executable === 'bun'))
      expect(command.args[0]).toBe('--no-env-file')
  }
})

it('prouve que le lanceur ne charge pas le dotenv de sa fixture', async () => {
  const root = mkdtempSync(join(tmpdir(), 'verify-dotenv-'))
  temporary.push(root)
  mkdirSync(join(root, 'scripts/quality'), { recursive: true })
  writeFileSync(join(root, '.env'), 'QUALITY_DOTENV_PROBE=fixture-only\n')
  writeFileSync(
    join(root, 'scripts/quality/security.ts'),
    'process.exitCode = process.env.QUALITY_DOTENV_PROBE === "fixture-only" ? 7 : 0',
  )
  const plan = buildPlan({ family: 'security', target: 'dashboard', list: true }, root, [])
  expect(await executePlan(plan)).toBe(0)
  expect(
    await executePlan({
      ...plan,
      commands: plan.commands.map((command) => ({
        ...command,
        args: command.args.filter((arg) => arg !== '--no-env-file'),
      })),
    }),
  ).toBe(7)
})
