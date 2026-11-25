#!/usr/bin/env python3
"""Piloter une lane existante ; aucune préparation implicite."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'codebase-integrity/domaines/construction-livraison/scripts'))
from worktrees import context, git
from environment import validate
from demand_status import scan, effective_closed, describe


def resolve_lane(cwd, layer):
    principal, records = context(cwd)
    settings = json.loads((ROOT / 'infra/config/layers.json').read_text())
    if not re.fullmatch(r'[a-z][a-z0-9-]*', layer) or layer not in settings['layers']:
        raise ValueError('Couche inconnue ; consulter infra/config/layers.json')
    branch = settings['layers'][layer]['branch']
    matches = [record for record in records if record.get('branch') == 'refs/heads/' + branch]
    if len(matches) != 1:
        raise ValueError('Worktree absent ; préparation : make worktree-add LAYER='
                         + layer + ' BASE=develop (après affectation)')
    tree = Path(matches[0]['worktree'])
    if tree.is_symlink() or not tree.is_dir():
        raise ValueError('Worktree inaccessible ou lien symbolique ; aucun changement')
    if Path(git(tree, 'rev-parse', '--path-format=absolute', '--git-common-dir')).resolve() != principal / '.git':
        raise ValueError('Worktree appartenant à un autre dépôt')
    if git(tree, 'branch', '--show-current') != branch:
        raise ValueError('Branche différente de la couche configurée')
    return tree


def prepare_test_container(tree, name):
    """Réparer uniquement une précédente exécution jetable de cette couche."""
    fields = '{{json .State}}|{{json .HostConfig.AutoRemove}}|{{json .Config.Labels}}'
    result = subprocess.run(['docker', 'inspect', '--format', fields, name],
                            capture_output=True, text=True)
    if result.returncode:
        diagnostic = result.stderr.strip()
        if 'no such object' in diagnostic.casefold() or 'no such container' in diagnostic.casefold():
            return False
        raise ValueError('État Docker inaccessible ; aucun conteneur modifié : ' + diagnostic[:500])
    state, automatic, labels = map(json.loads, result.stdout.strip().split('|', 2))
    if (not automatic or labels.get('com.docker.compose.service') not in ('app-test', 'verify')
            or labels.get('com.docker.compose.oneoff', '').lower() != 'true'
            or labels.get('com.docker.compose.project.working_dir') != str(tree)):
        raise ValueError('Nom occupé par un conteneur étranger ; conservé')
    if state['Status'] == 'running':
        print('INFO — Serveur de test déjà actif ; conservé. '
              'Consulter lane-logs MODE=test pour son état de préparation.', flush=True)
        return True
    if state['Status'] not in ('created', 'exited', 'dead'):
        raise ValueError('Conteneur de test en transition ou suspendu ; conservé')
    # Sans force ni suppression de volume : un démarrage concurrent fait refuser rm.
    removed = subprocess.run(['docker', 'rm', name], capture_output=True, text=True)
    if removed.returncode:
        raise ValueError('Conteneur non supprimé ; état à revérifier, aucune suppression forcée')
    print('INFO — Ancien conteneur de test incomplet ou arrêté supprimé ; relance.', flush=True)
    return False


def run_test(action, layer, tree):
    """Mode test isolé ; aucune lecture du .env de développement."""
    principal, _ = context(tree)
    config = json.loads((tree / 'infra/config/layers.json').read_text())
    target = os.environ.get('GD_TARGET') or (
        'dashboard' if layer == 'dashboard' else 'showcase-immobilier')
    if target not in ('showcase-immobilier', 'client2-immobilier', 'dashboard'):
        raise ValueError('Cible de test inconnue')
    port = int(os.environ.get('WEBAPP_TEST_PORT') or
               (config.get('testPortBase', 19850) + config['layers'][layer]['id']))
    if not 1024 <= port <= 65535:
        raise ValueError('Port de test invalide')
    fingerprint = hashlib.sha256(str(principal).encode()).hexdigest()[:8]
    name = f"{config['project']}-{fingerprint}-{layer}-test-{target}"
    goals = {'up': '_lane-test-up', 'down': '_lane-test-down',
             'logs': '_lane-test-logs', 'status': '_lane-test-status'}
    if action in ('up', 'rebuild') and prepare_test_container(tree, name):
        if action == 'rebuild':
            raise ValueError('Serveur actif ; arrêter ce mode test avant reconstruction')
        return 0
    if action == 'rebuild':
        result = subprocess.run(['make', '--no-print-directory', 'checks-rebuild'], cwd=tree)
        if result.returncode:
            return result.returncode
        action = 'up'
    print(f'Mode test | couche : {layer} | cible : {target} | '
          f'URL : http://127.0.0.1:{port}', flush=True)
    return subprocess.run([
        'make', '--no-print-directory', goals[action], f'LAYER={layer}', f'GD_TARGET={target}',
        f'WEBAPP_TEST_PORT={port}', f'CHECKS_FIXTURE_NAME={name}',
    ], cwd=tree).returncode


def run(action, layer, cwd=None, build=False, mode="dev"):
    if mode not in ('dev', 'test'):
        raise ValueError('Mode inconnu ; utiliser MODE=dev ou MODE=test')
    tree = resolve_lane(cwd or Path.cwd(), layer)
    if mode == 'test':
        return run_test(action, layer, tree)
    try:
        _, values = validate(tree, layer)
    except (OSError, ValueError, KeyError):
        raise ValueError('Environnement absent ou incohérent ; conservé. Vérifier avec make -C '
                         + shlex.quote(str(tree)) + ' lane-check LAYER=' + layer
                         + ' ; préparer avec la même commande lane-env au lieu de lane-check.') from None
    settings = json.loads((tree / 'infra/config/layers.json').read_text())['layers'][layer]
    compose_file = settings.get('devComposeFile', 'infra/docker/docker-compose.dev.yml')
    services = settings.get('devServices', ['webapp-localhost'])
    if not isinstance(compose_file, str):
        raise ValueError('Composition de développement invalide')
    relative = Path(compose_file)
    if relative.is_absolute() or '..' in relative.parts or not compose_file.startswith('infra/docker/'):
        raise ValueError('Composition de développement invalide')
    if (tree / relative).is_symlink() or not (tree / relative).is_file():
        raise ValueError('Composition de développement absente ou symbolique')
    if not isinstance(services, list) or not services or any(
            not isinstance(service, str) or not re.fullmatch(r'[a-z][a-z0-9-]*', service)
            for service in services):
        raise ValueError('Services de développement invalides')
    # Le nom validé du .env prime sur un éventuel COMPOSE_PROJECT_NAME hérité du shell.
    compose = ['docker', 'compose', '--project-name', values['COMPOSE_PROJECT_NAME'],
               '--project-directory', '.', '--env-file', 'webapp/.env',
               '-f', compose_file]
    commands = {
        'up': ['up', '-d', *(['--build'] if build else []), *services],
        'rebuild': ['up', '-d', '--build', '--force-recreate', *services],
        'down': ['down'],
        'logs': ['logs', '-f', '--tail', '200'],
    }
    return subprocess.run(compose + commands[action], cwd=tree).returncode


def docker_inventory():
    """Noms, états et projets seulement ; ne pas lire les variables des conteneurs."""
    try:
        result = subprocess.run(
            ['docker', 'ps', '--all', '--filter', 'label=com.docker.compose.project',
             '--format', '{{.Label "com.docker.compose.project"}}\t{{.Names}}\t{{.State}}\t{{.Status}}'],
            capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.TimeoutExpired):
        return {}, 'Docker inaccessible (commande absente ou délai dépassé)'
    if result.returncode:
        return {}, 'Docker inaccessible (accès refusé ou daemon indisponible)'
    projects = {}
    for line in result.stdout.splitlines():
        fields = line.split('\t', 3)
        if len(fields) != 4 or not fields[0]:
            return {}, 'Docker : réponse non interprétable'
        project, name, state, summary = fields
        projects.setdefault(project, []).append((name, state, summary))
    return projects, None


def git_changes(tree):
    raw = subprocess.check_output(['git', '-C', str(tree), 'status', '--porcelain=v1',
                                   '-z', '--untracked-files=all'],
                                  env={**os.environ, 'GIT_OPTIONAL_LOCKS': '0'})
    changes = []
    fields = iter(raw.split(b'\0'))
    for record in fields:
        if not record:
            continue
        xy = record[:2].decode('ascii')
        name = os.fsdecode(record[3:])
        changes.append((xy, name))
        if 'R' in xy or 'C' in xy:
            next(fields, None)  # Ancien chemin d'un renommage, pas un second fichier.
    return changes


def status(layer=None, cwd=None):
    cwd = cwd or Path.cwd()
    principal, records = context(cwd)
    settings = json.loads((ROOT / 'infra/config/layers.json').read_text())
    layers = settings['layers']
    if layer and (not re.fullmatch(r'[a-z][a-z0-9-]*', layer) or layer not in layers):
        raise ValueError('Couche inconnue ; consulter infra/config/layers.json')
    selected = [layer] if layer else list(layers)
    demands, tasks, warnings = scan(cwd)
    projects, docker_error = docker_inventory()
    fingerprint = hashlib.sha256(str(principal).encode()).hexdigest()[:8]
    lines = ['État local ; une couche propre ne prouve pas sa disponibilité.']
    for name in selected:
        branch = layers[name]['branch']
        project = f"{settings['project']}-{fingerprint}-{name}"
        matching = [r for r in records if r.get('branch') == 'refs/heads/' + branch]
        if not matching:
            matching = [r for r in records if Path(r['worktree']) == principal / 'worktree' / name]
        lines.append(f'\n{name} | branche attendue : {branch}')
        if len(matching) != 1:
            lines.append('  Git : worktree absent ou affectation ambiguë')
        else:
            tree = Path(matching[0]['worktree'])
            lines.append('  Worktree : ' + str(tree))
            try:
                if tree.is_symlink() or not tree.is_dir():
                    raise ValueError('worktree inaccessible ou lien symbolique')
                common = Path(git(tree, 'rev-parse', '--path-format=absolute', '--git-common-dir'))
                if common.resolve() != principal / '.git':
                    raise ValueError('worktree appartenant à un autre dépôt')
                actual = git(tree, 'branch', '--show-current') or 'HEAD détachée'
                head = git(tree, 'rev-parse', '--short', 'HEAD')
                lines.append(f'  Git : {actual} @ {head}')
                if actual != branch:
                    lines.append('  ⚠ Branche différente de la couche configurée')
                changes = git_changes(tree)
                staged = sum(xy[0] not in (' ', '?') for xy, _ in changes)
                modified = sum(xy[1] != ' ' and xy != '??' for xy, _ in changes)
                untracked = sum(xy == '??' for xy, _ in changes)
                lines.append(f'  Changements : indexés {staged} ; non indexés {modified} ; non suivis {untracked}')
                for xy, path in changes:
                    lines.append('    ' + xy + ' ' + json.dumps(path, ensure_ascii=False))
            except (OSError, ValueError, subprocess.CalledProcessError):
                lines.append('  Git : inconnu, worktree inaccessible ou lecture refusée')
        lines.append('  Projet Docker attendu : ' + project)
        if docker_error:
            lines.append('  ' + docker_error)
        elif project not in projects:
            lines.append('  Docker : aucun conteneur pour ce projet (services absents)')
        else:
            for container, state, summary in projects[project]:
                lines.append(f'  Docker : {container} | {state} | {summary}')
        lines.append('  Cartes locales des demandes sans clôture reconnue (activité réelle non établie) :')
        found = False
        for _, docs in sorted(tasks.items()):
            relevant = [d for d in docs if d.layer == name and
                        (d.demand not in demands or not effective_closed(demands[d.demand]))]
            if relevant:
                found = True
                lines.extend(describe(relevant, task=True))
                if any(d.demand not in demands for d in relevant):
                    lines.append('    ⚠ Demande absente ou inconnue ; état à examiner')
        if not found:
            lines.append('  Missions : aucune carte en cours identifiée ; disponibilité inconnue')
    lines.extend('⚠ ' + warning for warning in warnings)
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['up', 'down', 'logs', 'rebuild', 'status'])
    parser.add_argument('layer', nargs='?', default=os.environ.get('AIDE_OPERAND') or os.environ.get('LAYER'))
    args = parser.parse_args()
    mode = os.environ.get('MODE', 'dev')
    if not args.layer and (args.action != 'status' or mode == 'test'):
        parser.error('Couche requise, par exemple : make lane-up web')
    try:
        if mode not in ('dev', 'test'):
            raise ValueError('Mode inconnu ; utiliser MODE=dev ou MODE=test')
        if args.action == 'status' and mode == 'dev':
            print(status(args.layer))
            return 0
        return run(args.action, args.layer, build=bool(os.environ.get('BUILD')), mode=mode)
    except (OSError, ValueError, KeyError) as exc:
        parser.exit(1, f'Erreur : {exc}\n')
    except KeyboardInterrupt:
        return 130


if __name__ == '__main__':
    sys.exit(main())
