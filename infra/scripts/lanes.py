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


def run(action, layer, cwd=None, build=False):
    tree = resolve_lane(cwd or Path.cwd(), layer)
    try:
        _, values = validate(tree, layer)
    except (OSError, ValueError, KeyError):
        raise ValueError('Environnement absent ou incohérent ; conservé. Vérifier avec make -C '
                         + shlex.quote(str(tree)) + ' lane-check LAYER=' + layer
                         + ' ; préparer avec la même commande lane-env au lieu de lane-check.') from None
    # Le nom validé du .env prime sur un éventuel COMPOSE_PROJECT_NAME hérité du shell.
    compose = ['docker', 'compose', '--project-name', values['COMPOSE_PROJECT_NAME'],
               '--project-directory', '.', '--env-file', 'webapp/.env',
               '-f', 'infra/docker/docker-compose.dev.yml']
    commands = {
        'up': ['up', '-d', *(['--build'] if build else []), 'webapp-localhost'],
        'rebuild': ['up', '-d', '--build', '--force-recreate', 'webapp-localhost'],
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
    if not args.layer and args.action != 'status':
        parser.error('Couche requise, par exemple : make lane-up web')
    try:
        if args.action == 'status':
            print(status(args.layer))
            return 0
        return run(args.action, args.layer, build=bool(os.environ.get('BUILD')))
    except (OSError, ValueError, KeyError) as exc:
        parser.exit(1, f'Erreur : {exc}\n')
    except KeyboardInterrupt:
        return 130


if __name__ == '__main__':
    sys.exit(main())
