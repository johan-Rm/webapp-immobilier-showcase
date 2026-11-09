#!/usr/bin/env python3
"""Exercer deux piles Nuxt simultanées dans un dépôt jetable, sans API réelle."""
from pathlib import Path as _Path
import sys as _sys
_common = _Path(__file__).resolve().parent
if not (_common / 'bootstrap.py').is_file():
    _common = next((p / 'codebase-integrity/commun' for p in _Path(__file__).resolve().parents if (p / 'codebase-integrity/commun').is_dir()), _common)
_sys.path.insert(0, str(_common))
from bootstrap import REPO_ROOT, configure_imports
configure_imports()

import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
from urllib.request import ProxyHandler, build_opener


def run(argv, cwd):
    result = subprocess.run(argv, cwd=cwd, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(f'{argv[0]} a échoué : {result.stderr[-2000:]}')
    return result.stdout.strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--image', required=True, help='image dev locale existante, aucun pull/build')
    parser.add_argument('--timeout', type=int, default=180)
    args = parser.parse_args()
    source = REPO_ROOT
    run(['docker', 'image', 'inspect', args.image], source)
    folder = Path(tempfile.mkdtemp(prefix='showcase-aide-runtime-'))
    repo = folder / 'repo'
    repo.mkdir()
    stacks = []
    passed = False
    opener = build_opener(ProxyHandler({}))
    try:
        names = run(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], source).split('\0')
        for name in filter(None, names):
            relative = Path(name)
            if any(part.startswith('.env') and part != '.env.example' for part in relative.parts):
                continue
            path = source / relative
            if not path.is_file():
                continue
            if path.is_symlink():
                raise RuntimeError('Source liée non copiée : ' + name)
            target = repo / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(path, target)
        run(['git', 'init', '-b', 'develop'], repo)
        run(['git', 'config', 'user.name', 'AIDE Runtime Test'], repo)
        run(['git', 'config', 'user.email', 'aide-test@example.invalid'], repo)
        run(['git', 'add', '.'], repo)
        run(['git', '-c', 'commit.gpgsign=false', 'commit', '-m', 'snapshot de test'], repo)
        report = []
        for layer, port in [('web', 19301), ('bff', 19302)]:
            # Les ports sont ceux de la configuration du snapshot, pas du dépôt utilisateur.
            script = repo / 'codebase-integrity/domaines/construction-livraison/scripts/worktrees.py'
            run([sys.executable, str(script), 'add', '--layer', layer,
                 '--branch', 'layers/' + layer, '--base', 'develop'], repo)
            tree = repo / 'worktree' / layer
            run([sys.executable, str(tree / 'codebase-integrity/domaines/construction-livraison/scripts/environment.py'),
                 'prepare', '--layer', layer], tree)
            override = tree / 'infra/runtime-test.yaml'
            override.write_text('services:\n  webapp-localhost:\n    image: ' + json.dumps(args.image) + '\n')
            compose = ['docker', 'compose', '--project-directory', '.', '--env-file', 'webapp/.env', '-f',
                       'infra/docker/docker-compose.dev.yml', '-f', 'infra/runtime-test.yaml']
            stacks.append((tree, compose))
            run(compose + ['run', '--rm', '--no-deps', 'webapp-localhost', 'bun', 'run', 'setup:local'], tree)
            # Contenus différents : la route doit lire sa propre copie du YAML.
            config_path = tree / 'webapp/content/fr/ui/app.yaml'
            raw = config_path.read_text()
            import re
            block = 'i18n:\n  sourceLocale: fr\n  enabledLocales: ' + ('[fr]' if layer == 'web' else '[fr, en]') + '\n\n'
            config_path.write_text(re.sub(r'^i18n:\n.*?(?=^\S|\Z)', block, raw, count=1, flags=re.M | re.S))
            run(compose + ['up', '-d', '--no-build', 'webapp-localhost'], tree)
            report.append({'layer': layer, 'port': port, 'tree': str(tree)})
        deadline = time.monotonic() + args.timeout
        for item, (tree, compose) in zip(report, stacks):
            url = f'http://127.0.0.1:{item["port"]}/api/project-config'
            while True:
                try:
                    with opener.open(url, timeout=5) as response:
                        config = json.load(response)
                    break
                except Exception:
                    if time.monotonic() > deadline:
                        logs = run(compose + ['logs', '--tail', '30', 'webapp-localhost'], tree)
                        raise RuntimeError('Délai dépassé : ' + url + '\n' + logs)
                    time.sleep(1)
            expected = ['fr'] if item['layer'] == 'web' else ['fr', 'en']
            if config != {'sourceLocale': 'fr', 'enabledLocales': expected}:
                raise RuntimeError('Contenu croisé : ' + str(config))
            with opener.open(f'http://127.0.0.1:{item["port"]}/fr', timeout=60) as response:
                html = response.read().decode()
                if '<html' not in html or '__NUXT' not in html:
                    raise RuntimeError('Rendu SSR absent')
            layer = item['layer']
            run(compose + ['exec', '-T', 'webapp-localhost', 'sh', '-c',
                           f'set -eu; mkdir -p /app/.data /app/node_modules/.cache; echo {layer} > /app/.data/aide-isolation; echo {layer} > /app/node_modules/.cache/aide-isolation'], tree)
            container = run(compose + ['ps', '-q', 'webapp-localhost'], tree)
            inspection = json.loads(run(['docker', 'inspect', container], tree))[0]
            item['project'] = inspection['Config']['Labels']['com.docker.compose.project']
            item['container'] = inspection['Id'][:12]
            item['networks'] = sorted(inspection['NetworkSettings']['Networks'])
            item['mounts'] = {mount['Destination']: mount['Source'] for mount in inspection['Mounts']
                              if mount['Destination'] in ['/app/.data', '/app/content', '/opt/app-schemas']}
            schemas = [mount for mount in inspection['Mounts'] if mount['Destination'] == '/opt/app-schemas']
            if len(schemas) != 1 or schemas[0]['RW']:
                raise RuntimeError('Schémas source non protégés en lecture seule')
            item['locales'] = config['enabledLocales']
            item['ssr'] = 200
        print(json.dumps({'observations': report}, ensure_ascii=False, indent=2), flush=True)
        for item, (tree, compose) in zip(report, stacks):
            marker = (tree / 'webapp/.data/aide-isolation').read_text().strip()
            cache = run(compose + ['exec', '-T', 'webapp-localhost', 'cat', '/app/node_modules/.cache/aide-isolation'], tree)
            if marker != item['layer'] or cache != item['layer']:
                raise RuntimeError('Écritures de données ou cache partagées')
        if report[0]['project'] == report[1]['project'] or report[0]['networks'] == report[1]['networks']:
            raise RuntimeError('Projets ou réseaux partagés')
        print(json.dumps({'isolation': 'validée', 'stacks': report}, ensure_ascii=False, indent=2))
        passed = True
    finally:
        cleaned = True
        for tree, compose in reversed(stacks):
            try:
                run(compose + ['down', '--remove-orphans'], tree)
            except Exception as error:
                cleaned = False
                print(f'Nettoyage à terminer dans {tree} : {error}', file=sys.stderr)
        if cleaned and passed:
            shutil.rmtree(folder)
        else:
            print('Dépôt temporaire conservé : ' + str(folder), file=sys.stderr)
    return 0 if passed else 1


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, RuntimeError, subprocess.SubprocessError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
