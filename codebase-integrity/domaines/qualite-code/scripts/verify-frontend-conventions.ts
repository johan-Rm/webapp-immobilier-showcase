import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { diagnosticLimit, sourceContext } from '../../../commun/console-context'
import {
  analyzeLayerConfig,
  analyzeScriptSource,
  analyzeVue,
  loadFrontendPolicy,
  policyExitCode,
  relativeFrontendName,
} from '../../../commun/frontend-policy'
import { ROOT, isFrontendFile, listProjectFiles } from '../../../commun/validation-rules'

const colored =
  Boolean(process.stdout.isTTY) &&
  !['', 'dumb'].includes(process.env.TERM ?? '') &&
  !('NO_COLOR' in process.env)
const paint = (text: string, color: number) => (colored ? `\x1b[${color}m${text}\x1b[0m` : text)
const say = (text: string) => process.stdout.write(text + '\n')

export function runFrontendPolicy() {
  say('Contrôle des conventions frontend — 3 étapes\n')
  say(sourceContext(ROOT))
  say(
    paint(
      'INFO — Analyse les sources frontend ; les tests fonctionnels et le rendu navigateur restent distincts.\n',
      34,
    ),
  )
  say(paint('[1/3] EN COURS — Découvrir les sources', 34))
  say('  Inclut les applications inactives et les fichiers non suivis non ignorés.')
  const policy = loadFrontendPolicy()
  const files = listProjectFiles(['.vue', '.ts'])
  const selected = files.filter(
    (file) =>
      isFrontendFile(file) ||
      relativeFrontendName(file, ROOT) === 'nuxt.config.ts' ||
      /^base\/.*\/nuxt\.config\.ts$/.test(relativeFrontendName(file, ROOT)),
  )
  if (!files.some((file) => relativeFrontendName(file, ROOT) === 'nuxt.config.ts'))
    throw new Error('Configuration Nuxt racine absente ; sélection des applications non vérifiée.')
  if (!selected.length) throw new Error('Aucune source frontend découverte ; contrôle non exécuté.')
  say('  ' + paint(`RÉUSSI — ${selected.length} fichiers découverts.\n`, 32))
  say(paint('[2/3] EN COURS — Analyser les conventions', 34))
  say('  Vérifie les blocs Vue, les marqueurs, les régions, les imports et les layers.')
  const findings = selected.flatMap((file) => {
    const source = readFileSync(file, 'utf-8')
    let result
    if (file.endsWith('.vue')) result = analyzeVue(source, file, ROOT, policy)
    else if (file.endsWith('nuxt.config.ts')) result = analyzeLayerConfig(source, file, ROOT)
    else result = analyzeScriptSource(source, file, ROOT, 0, policy)
    return result.map((finding) => ({ file: relativeFrontendName(file, ROOT), ...finding }))
  })
  const directory = join(ROOT, '.tmp/quality')
  mkdirSync(directory, { recursive: true })
  const report = join(directory, 'frontend-conventions.json')
  writeFileSync(report, JSON.stringify({ files: selected.length, findings }, null, 2) + '\n')
  const errors = findings.filter((entry) => entry.severity === 'error')
  const warnings = findings.filter((entry) => entry.severity === 'warning')
  const exemptions = findings.filter((entry) => entry.severity === 'exemption')
  say(
    '  ' +
      paint(
        errors.length
          ? `ÉCHEC — ${errors.length} erreurs bloquantes.`
          : 'RÉUSSI — aucune erreur bloquante.',
        errors.length ? 31 : 32,
      ),
  )
  say(
    '  ' +
      paint(
        `${warnings.length} avertissements à relire ; ${exemptions.length} exemptions explicites.\n`,
        warnings.length || exemptions.length ? 33 : 90,
      ),
  )
  say(paint('[3/3] RÉUSSI — Enregistrer le rapport détaillé', 32))
  say(`  Rapport complet : ${report}\n`)
  if (errors.length) {
    say(
      paint(
        errors.length <= 8
          ? 'Erreurs à corriger :'
          : 'Premières erreurs à corriger (3 affichées) :',
        31,
      ),
    )
    for (const entry of errors.slice(0, diagnosticLimit(errors.length))) {
      say(`  ${entry.file}:${entry.line}`)
      say(`    ${entry.message} [${entry.rule}]`)
    }
    say('')
  }
  say(
    paint(
      errors.length
        ? 'Résultat : ÉCHEC — corriger les erreurs puis relancer la commande.'
        : 'Résultat : RÉUSSI — aucun écart bloquant.',
      errors.length ? 31 : 32,
    ),
  )
  say('Les avertissements demandent une relecture ; les exemptions ne prouvent pas la conformité.')
  say(
    paint(
      'Limites : sélection statique des sources ; métier et rendu final à vérifier séparément.',
      90,
    ),
  )
  return policyExitCode(findings)
}

if (import.meta.main) {
  try {
    process.exitCode = runFrontendPolicy()
  } catch (error) {
    process.stderr.write(`Contrôle frontend impossible : ${String(error)}\n`)
    process.exitCode = 1
  }
}
