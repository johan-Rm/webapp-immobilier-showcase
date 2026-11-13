#!/usr/bin/env python3
"""Piloter une lane existante ; aucune préparation implicite."""
import argparse
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['up', 'down', 'logs', 'rebuild'])
    parser.add_argument('layer', nargs='?', default=os.environ.get('AIDE_OPERAND') or os.environ.get('LAYER'))
    args = parser.parse_args()
    if not args.layer:
        parser.error('Couche requise, par exemple : make lane-up web')
    try:
        return run(args.action, args.layer, build=bool(os.environ.get('BUILD')))
    except (OSError, ValueError, KeyError) as exc:
        parser.exit(1, f'Erreur : {exc}\n')
    except KeyboardInterrupt:
        return 130


if __name__ == '__main__':
    sys.exit(main())
