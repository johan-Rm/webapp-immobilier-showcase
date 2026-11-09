#!/usr/bin/env python3
"""Préparer les dossiers Git ; aucun service, secret ou accès réseau."""
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
import re
import subprocess
import sys


def git(root, *args):
    result = subprocess.run(['git', '-C', str(root), *args], text=True,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode:
        raise ValueError(result.stderr.strip() or 'Git a échoué')
    return result.stdout.strip()


def context(cwd):
    common = Path(git(cwd, 'rev-parse', '--path-format=absolute', '--git-common-dir'))
    if common.name != '.git' or git(cwd, 'rev-parse', '--is-bare-repository') != 'false':
        raise ValueError('Un dépôt principal non bare avec un dossier .git est requis')
    root = common.parent.resolve()
    git(root, 'rev-parse', '--verify', 'HEAD')
    records = []
    # Le mode -z protège les chemins contenant espaces ou retours à la ligne.
    raw = subprocess.check_output(['git', '-C', str(root), 'worktree', 'list', '--porcelain', '-z'])
    record = {}
    for field in raw.decode().split('\0'):
        if not field:
            if record:
                records.append(record)
                record = {}
            continue
        key, _, value = field.partition(' ')
        record[key] = value
    if record:
        records.append(record)
    return root, records


def add(cwd, layer, branch, base):
    root, records = context(cwd)
    tree = Path(git(cwd, 'rev-parse', '--show-toplevel'))
    settings = json.loads((tree / 'infra/config/layers.json').read_text())
    config = settings['layers']
    if not re.fullmatch('[a-z][a-z0-9-]*', layer) or layer not in config:
        raise ValueError('Couche inconnue ou nom invalide')
    if branch != config[layer]['branch']:
        raise ValueError('La branche ne correspond pas à la couche configurée')
    git(root, 'check-ref-format', '--branch', branch)
    if base.startswith('-'):
        raise ValueError('Base invalide')
    sha = git(root, 'rev-parse', '--verify', '--end-of-options', base + '^{commit}')
    for required in settings.get('requireBasePaths', []):
        if not isinstance(required, str):
            raise ValueError('Chemin de base requis invalide')
        required_path = Path(required)
        if required_path.is_absolute() or '..' in required_path.parts:
            raise ValueError('Chemin de base requis invalide')
        metadata = git(root, 'ls-tree', sha, '--', required).split()
        if not metadata or metadata[0] not in ('100644', '100755'):
            raise ValueError('Base incomplète pour AIDE : ' + required + ' ; intégrer le socle avant de créer une couche')
    parent = root / 'worktree'
    destination = parent / layer
    if parent.is_symlink() or destination.is_symlink():
        raise ValueError('Lien symbolique inattendu dans la destination')
    if parent.exists() and not parent.is_dir():
        raise ValueError('worktree doit être un dossier')
    for item in records:
        path = Path(item['worktree'])
        if path.resolve() == destination.resolve() and item.get('branch') != 'refs/heads/' + branch:
            raise ValueError('Destination enregistrée sur une branche inattendue')
    for item in records:
        if item.get('branch') == 'refs/heads/' + branch:
            path = Path(item['worktree'])
            if path.is_symlink() or not path.is_dir():
                raise ValueError('Worktree enregistré inaccessible ou lien symbolique')
            other_common = Path(git(path, 'rev-parse', '--path-format=absolute', '--git-common-dir'))
            if other_common.resolve() != (root / '.git').resolve():
                raise ValueError('Worktree appartenant à un autre dépôt')
            if git(path, 'branch', '--show-current') != branch:
                raise ValueError('Branche inattendue dans le worktree')
            return path.resolve(), False
    if destination.exists():
        raise ValueError('Destination existante non réutilisable ; aucun fichier modifié')
    parent.mkdir(exist_ok=True)
    exists = subprocess.run(['git', '-C', str(root), 'show-ref', '--verify', '--quiet',
                             'refs/heads/' + branch]).returncode
    if exists not in (0, 1):
        raise ValueError('Impossible de vérifier la branche')
    if exists == 0:
        git(root, 'worktree', 'add', str(destination), branch)
    else:
        git(root, 'worktree', 'add', '-b', branch, str(destination), sha)
    return destination.resolve(), True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('list', help='État Git ; les affectations restent à vérifier humainement')
    create = commands.add_parser('add')
    for name in ('layer', 'branch', 'base'):
        create.add_argument('--' + name, required=True)
    args = parser.parse_args()
    try:
        if args.command == 'add':
            path, created = add(Path.cwd(), args.layer, args.branch, args.base)
            print(('Créé' if created else 'Réutilisé') + ' : ' + str(path))
            print('Dossier Git uniquement ; disponibilité et services à vérifier séparément.')
        else:
            root, records = context(Path.cwd())
            for item in records:
                path = Path(item['worktree'])
                try:
                    status = git(path, 'status', '--porcelain')
                    state = 'modifié' if status else 'propre'
                except ValueError:
                    state = 'inaccessible'
                print(f"{path} | {item.get('branch', 'HEAD détachée')} | {state}")
            print('Un arbre propre ne prouve pas une couche libre. Aucun fetch effectué.')
    except (ValueError, OSError, KeyError) as exc:
        parser.exit(1, f'Erreur : {exc}\n')


if __name__ == '__main__':
    main()
