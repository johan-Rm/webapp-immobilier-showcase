#!/usr/bin/env python3
"""Interface des commandes Make : contexte, journal hôte et bilan sans altérer les contrôles."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import tempfile
import textwrap
import time

from run_aide_checks import paint, supports_color

ROOT = Path(__file__).resolve().parents[2]
# Catégorie, type, objet, outils, niveau : métadonnées d’affichage uniquement.
META = {
    'verifiers-tests-unit': ('Tests unitaires', 'Tests internes', 'Logique applicative et outils du projet', 'Vitest / Bun', 'Bloquant'),
    'verifiers-tests-integration': ('Intégration', 'Tests internes', 'Interactions applicatives et outils internes', 'Vitest', 'Bloquant'),
    'third-party-tests-components': ('Composants', 'Outils tiers', 'Pilote Dashboard', 'Nuxt / Vitest', 'Bloquant'),
    'third-party-tests-browser': ('Navigateur', 'Outils tiers', 'Parcours et accessibilité', 'Playwright / axe-core', 'Assertions bloquantes'),
    'verifiers-tests-mutation': ('Mutation', 'Tests internes', 'Efficacité des tests', 'Stryker / Vitest', 'Exécution bloquante ; score informatif'),
    'third-party-tests-lint': ('Code', 'Outils tiers', 'Règles de code', 'ESLint', 'Bloquant'),
    'third-party-tests-format': ('Code', 'Outils tiers', 'Mise en forme des fichiers', 'Prettier', 'Bloquant'),
    'third-party-tests-types': ('Code', 'Outils tiers', 'Types de la cible', 'Nuxt / Vue TSC', 'Bloquant'),
    'third-party-tests-code': ('Code', 'Outils tiers', 'Lint, formatage et types', 'ESLint / Prettier / Vue TSC', 'Bloquant'),
    'third-party-tests-security': ('Sécurité', 'Outils tiers', 'Avis des dépendances', 'Bun audit', 'High/critical bloquants'),
    'verifiers-tests-load': ('Charge', 'Tests internes', 'Charge locale bornée', 'k6', 'Exécution bloquante ; latences informatives'),
    'third-party-tests-lighthouse': ('Pages', 'Outils tiers', 'Audit des pages SSR', 'Lighthouse / Chromium', 'Exécution bloquante ; scores informatifs'),
    'conventions-all': ('Frontend', 'Conventions', 'Conventions Nuxt regroupées', 'Vérificateurs spécifiques', 'Erreurs bloquantes ; warnings à relire'),
    'conventions-frontend': ('Frontend', 'Conventions', 'Structure et marqueurs', 'AST Vue / TypeScript', 'Erreurs bloquantes ; warnings à relire'),
    'conventions-guards': ('Gardes', 'Conventions', 'Gardes suspectes', 'Vérificateur spécifique', 'Relecture humaine'),
    'conventions-services': ('Services', 'Conventions', 'Indépendance du framework', 'Vérificateur spécifique', 'Bloquant'),
    'conventions-architecture': ('Architecture', 'Conventions', 'Imports des services', 'dependency-cruiser', 'Bloquant'),
    'conventions-contracts': ('Contrats', 'Conventions', 'Reproductibilité locale', 'Générateur YAML', 'Bloquant'),
    'conventions-docs': ('Documentation', 'Conventions', 'Registre, demandes et README', 'Python', 'Bloquant'),
    'conventions-devbook': ('Traces', 'Conventions', 'Métadonnées et verdicts des cartes', 'Python', 'Bloquant'),
    'verifiers-test': ('Vérificateurs', 'Fiabilité des outils', 'Fonctionnement des vérificateurs', 'Python / Vitest / Bun', 'Bloquant'),
    'checks-prepare': ('Préparation', 'Environnement', 'Réutiliser ou construire l’image', 'Docker Compose', 'Prérequis'),
    'checks-rebuild': ('Préparation', 'Environnement', 'Construire explicitement l’image', 'Docker Compose', 'Prérequis'),
}
DESCRIPTIONS = {
    'verifiers-tests-unit': (
        'Exécute avec Vitest et Bun les tests unitaires de la logique applicative et des outils internes : calculs, transformations de données et gestion des erreurs.'
    ),
    'verifiers-tests-integration': (
        'Vérifie les échanges entre modules, les réponses HTTP simulées et le fonctionnement des commandes de préparation et de contrôle.'
    ),
    'third-party-tests-components': (
        'Monte le formulaire pilote Dashboard dans un environnement Nuxt et vérifie ses champs, ses interactions et ses états.'
    ),
    'third-party-tests-browser': (
        'Exécute les parcours navigateur de la cible dans Chromium et contrôle les réponses HTTP, les éléments attendus et les erreurs du navigateur selon les assertions de chaque scénario.'
    ),
    'verifiers-tests-mutation': (
        'Modifie volontairement le module pilote et relance ses tests pour mesurer les erreurs détectées, les mutations survivantes et les parties couvertes.'
    ),
    'third-party-tests-lint': (
        'Analyse le code de l’application Nuxt et des vérificateurs avec ESLint : contrôle le respect des règles configurées et signale les erreurs et avertissements.'
    ),
    'third-party-tests-format': (
        'Vérifie la mise en forme des fichiers de l’application et des vérificateurs selon la configuration Prettier du projet : indentation, guillemets, points-virgules, retours à la ligne et ordre des classes Tailwind.'
    ),
    'third-party-tests-types': (
        'Prépare les fichiers générés par Nuxt, puis vérifie la cohérence des types TypeScript, des composants Vue et de leurs usages pour la cible sélectionnée.'
    ),
    'third-party-tests-code': (
        'Exécute successivement les vérifications ESLint, Prettier et TypeScript/Vue pour contrôler les règles de code, la mise en forme et la cohérence des types.'
    ),
    'third-party-tests-security': (
        'Analyse les dépendances de l’application et des vérificateurs à partir de leurs fichiers de verrouillage et recense les vulnérabilités connues par niveau de gravité.'
    ),
    'verifiers-tests-load': (
        'Envoie un nombre borné de requêtes au serveur de test local avec k6 et mesure les temps de réponse ainsi que les erreurs rencontrées.'
    ),
    'third-party-tests-lighthouse': (
        'Audite les pages servies par le serveur de test avec Lighthouse et Chromium et produit les mesures de performance, d’accessibilité, de bonnes pratiques et de référencement.'
    ),
    'conventions-all': (
        'Exécute les vérificateurs des conventions frontend : structure Vue, placement des types, images, sections script setup, responsabilités et organisation du code.'
    ),
    'conventions-frontend': (
        'Analyse les sources Vue pour vérifier les marqueurs de pages et de composants, les sections sémantiques et les règles de structure frontend documentées.'
    ),
    'conventions-guards': (
        'Repère les conditions de protection potentiellement redondantes et fournit les occurrences à examiner avec leur contexte de code.'
    ),
    'conventions-services': (
        'Vérifie que les services respectent leur indépendance vis-à-vis du framework en recherchant les imports interdits par les conventions du projet.'
    ),
    'conventions-architecture': (
        'Construit le graphe des dépendances des services et vérifie les règles d’imports documentées avec dependency-cruiser.'
    ),
    'conventions-contracts': (
        'Génère deux fois les contrats YAML locaux dans des environnements isolés et compare les résultats pour vérifier leur reproductibilité.'
    ),
    'conventions-docs': (
        'Vérifie la cohérence du registre des conventions, les métadonnées des demandes et la conformité des documents et README aux règles documentaires du projet.'
    ),
    'conventions-devbook': (
        'Examine les cartes modifiées depuis la base Git indiquée par BASE et vérifie leurs métadonnées, leur traçabilité et leurs références de verdict.'
    ),
    'verifiers-test': (
        'Exécute les tests Python, Vitest et Bun de nos vérificateurs sur des exemples conformes, des violations et des exceptions pour contrôler leurs diagnostics et leurs codes de sortie.'
    ),
    'checks-prepare': (
        'Vérifie la présence de l’image Docker des contrôles et la construit lorsqu’elle est absente pour préparer les prochaines commandes.'
    ),
    'checks-rebuild': (
        'Reconstruit l’image Docker des contrôles à partir des sources et dépendances actuelles du worktree.'
    ),
}

ANSI = re.compile(r'\x1b\[[0-?]*[ -/]*[@-~]')


def precondition(command, env):
    if command == 'third-party-tests-browser' and not env.get('PLAYWRIGHT_BASE_URL'):
        return 'PLAYWRIGHT_BASE_URL absente ; préparer un serveur de test séparément.'
    if command in ('verifiers-tests-load', 'third-party-tests-lighthouse') and not env.get('QUALITY_BASE_URL'):
        return 'QUALITY_BASE_URL absente ; préparer un serveur de test séparément.'
    if command == 'third-party-tests-components' and env.get('GD_TARGET', 'showcase-immobilier') != 'dashboard':
        return 'Le pilote de composants est disponible uniquement avec GD_TARGET=dashboard.'
    if command == 'conventions-devbook' and not env.get('BASE'):
        return 'BASE absente ; fournir le SHA de départ des traces à vérifier.'
    return None


def details(text, failed):
    lines = [line.strip() for line in ANSI.sub('', text).splitlines() if line.strip()]
    summary = [line for line in lines if re.search(r'^(Test Files|Tests\s+\d+|Ran \d+|\d+ (pass|fail)\b|Contrats :|Architecture services :|Résultat :|INFO — (?:Image|Utilise)|\[\d+/\d+\]|\d+ avertissements|\d+ garde)', line)]
    if failed:
        errors = []
        for index, line in enumerate(lines):
            if re.search(r'(^FAIL\s|^Error:|^error:|^Caused by:|^make:|^✗|erreurs bloquantes|\[app-)', line):
                errors.append(line)
                if '[app-' in line and index + 1 < len(lines):
                    errors.append(lines[index + 1])
        summary = (errors[:8] if errors else lines[-6:]) + summary[-2:]
    return list(dict.fromkeys(summary))[-10:]


def run(command, argv, env=None, report_root=None):
    env = dict(os.environ if env is None else env)
    target = env.get('GD_TARGET') or 'showcase-immobilier'
    profile = env.get('PROFILE', '')
    category, kind, subject, tools, level = META[command]
    color = supports_color(sys.stdout, env)
    verbose = env.get('VERBOSE') == '1'
    context = f'{command} | {target}' + (f' | {profile}' if profile else '')
    def say(status, message, tone='blue'):
        print(paint(f'[{context}] {status} — {message}', tone, color), flush=True)
    print('\n' + paint('═' * 88, 'brand', color), flush=True)
    print(paint(f'NOM — make {command}', 'brand', color), flush=True)
    print()
    print(paint('DESCRIPTION', 'brand', color), flush=True)
    print(paint(textwrap.fill(DESCRIPTIONS[command], width=88), 'brand', color), flush=True)
    print(paint('─' * 88, 'gray', color), flush=True)
    for label, value in zip(('Catégorie', 'Type de contrôle', 'Ce qu’on vérifie', 'Commandes Make', 'Outils', 'Niveau'),
                            (category, kind, subject, f'make {command}', tools, level)):
        print(paint(f'{label:18}', 'gray', color) + ' │ ' + value, flush=True)
    print('Cible              │ ' + target + (f' ; profil {profile}' if profile else ''), flush=True)
    print(paint('═' * 88, 'brand', color), flush=True)
    directory = Path(report_root) if report_root else ROOT / 'webapp/.tmp/quality/console'
    directory.mkdir(parents=True, exist_ok=True)
    session = Path(tempfile.mkdtemp(prefix=command + '-', dir=directory))
    log = session / 'output.log'
    start = time.monotonic()
    missing = precondition(command, env)
    code, state = 2, 'NON EXÉCUTÉ'
    interrupted = False
    if missing:
        log.write_text(missing + '\n')
        say('[1/1] NON EXÉCUTÉ', missing, 'yellow')
    else:
        say('[1/1] EN COURS', 'Sortie en direct ; journal complet conservé.' if verbose else 'Exécution ; les détails sont conservés dans le journal.')
        child_env = {**env, 'CHECK_PRESENTATION_ACTIVE': '1', 'NO_COLOR': '1', 'TERM': 'dumb', 'PYTHONUNBUFFERED': '1'}
        # Les journaux temporaires des contrôles imbriqués restent accessibles sur l’hôte.
        child_env['TMPDIR'] = str(session)
        try:
            with log.open('w') as stream, log.open(encoding='utf8', errors='replace') as reader:
                pending = ''
                def relay(final=False):
                    nonlocal pending
                    if not verbose:
                        return
                    pending += reader.read()
                    lines = pending.split('\n')
                    pending = lines.pop()
                    for line in lines:
                        say('OUTIL', ANSI.sub('', line), 'gray')
                    if final and pending:
                        say('OUTIL', ANSI.sub('', pending), 'gray')
                        pending = ''
                heartbeat = time.monotonic()
                child = subprocess.Popen(argv, cwd=ROOT, env=child_env, stdout=stream, stderr=subprocess.STDOUT, start_new_session=True)
                while True:
                    try:
                        code = child.wait(timeout=0.1 if verbose else 10)
                        relay(final=True)
                        break
                    except subprocess.TimeoutExpired:
                        relay()
                        if time.monotonic() - heartbeat >= 10:
                            say('[1/1] EN COURS', f'{time.monotonic() - start:.0f} s ; journal : {log}')
                            heartbeat = time.monotonic()
                    except KeyboardInterrupt:
                        interrupted = True
                        os.killpg(child.pid, signal.SIGTERM)
                        try:
                            child.wait(timeout=5)
                        except subprocess.TimeoutExpired:
                            os.killpg(child.pid, signal.SIGKILL)
                            child.wait()
                        relay(final=True)
                        code = 130
                        break
            state = 'INTERROMPU' if interrupted else 'RÉUSSI' if code == 0 else 'ÉCHEC'
            code = code if code >= 0 else 128 - code
        except OSError as error:
            log.write_text(str(error) + '\n')
            missing = str(error)
    raw = log.read_text(errors='replace')
    log.write_text(ANSI.sub('', raw))
    for line in ([] if missing or verbose else details(raw, bool(code))):
        say('DÉTAIL', line, 'gray')
    # Pas de total d’avertissements inventé à partir des logs des fixtures.
    warnings = [line.strip() for line in raw.splitlines() if re.search(r'\d+ (avertissements à relire|garde\(s\).*revue|occurrence\(s\).*revue)', line)]
    for line in dict.fromkeys(warnings):
        say('À RELIRE', line, 'yellow')
    elapsed = round(time.monotonic() - start, 2)
    say('BILAN ' + state, f'{elapsed:.1f} s ; code {code}', 'green' if code == 0 else 'yellow' if missing or interrupted else 'red')
    if warnings:
        say('AVERTISSEMENTS', 'Signalements à relire ; décompte global non consolidé.', 'yellow')
    say('RAPPORT', str(log), 'gray')
    result = {'command': command, 'target': target, 'profile': profile, 'status': state, 'exit_code': code,
              'duration_seconds': elapsed, 'log': str(log), 'warning_count': None,
              'reason': missing, 'timestamp': datetime.now(timezone.utc).isoformat()}
    (session / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=[*META, 'checks-run'])
    parser.add_argument('args', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    argv = args.args[1:] if args.args[:1] == ['--'] else args.args
    if os.environ.get('CHECK_PRESENTATION_ACTIVE') == '1':
        return subprocess.call(argv, cwd=ROOT) if argv else 2
    if args.command != 'checks-run':
        if not argv:
            parser.error('Commande interne requise après --')
        return run(args.command, argv)['exit_code']
    results = []
    # Un seul client ; les pilotes propres à une autre cible ne sont pas exécutés implicitement.
    names = [name for name in META if name not in ('third-party-tests-code', 'checks-prepare', 'checks-rebuild')]
    for name in names:
        profiles = ('desktop', 'mobile') if name == 'third-party-tests-lighthouse' else ('',)
        for profile in profiles:
            env = dict(os.environ)
            if profile:
                env['PROFILE'] = profile
            result = run(name, ['make', '--no-print-directory', '_output-' + name], env)
            results.append(result)
            if result['exit_code'] == 130:
                break
        if results[-1]['exit_code'] == 130:
            break
    root = ROOT / 'webapp/.tmp/quality/console'
    descriptor, filename = tempfile.mkstemp(prefix='summary-', suffix='.json', dir=root)
    with os.fdopen(descriptor, 'w') as stream:
        json.dump(results, stream, ensure_ascii=False, indent=2)
    context = f'[checks-run | {os.environ.get("GD_TARGET") or "showcase-immobilier"}]'
    print('\n' + '═' * 88 + '\n' + context + ' BILAN GLOBAL — exécutions de cette commande uniquement', flush=True)
    for result in results:
        profile = (' / ' + result['profile']) if result.get('profile') else ''
        print(f"{context} {result['command']}{profile} : {result['status']}", flush=True)
    for status in ('RÉUSSI', 'ÉCHEC', 'NON EXÉCUTÉ', 'INTERROMPU'):
        print(f'{context} {status} : {sum(r["status"] == status for r in results)}', flush=True)
    print(context + ' Avertissements : consulter les signalements et journaux ; aucun total fiable consolidé.')
    print(context + ' Rapport global : ' + filename)
    return 1 if any(r['exit_code'] for r in results) else 0


if __name__ == '__main__':
    sys.exit(main())
