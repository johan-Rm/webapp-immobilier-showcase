#!/usr/bin/env python3
"""Contrôle des messages et d'une plage Git explicite, sans réécriture."""
from pathlib import Path as _Path
import sys as _sys
_common = _Path(__file__).resolve().parent
if not (_common / 'bootstrap.py').is_file():
    _common = next((p / 'codebase-integrity/commun' for p in _Path(__file__).resolve().parents if (p / 'codebase-integrity/commun').is_dir()), _common)
_sys.path.insert(0, str(_common))
from bootstrap import REPO_ROOT, configure_imports
configure_imports()

import argparse
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys

ROOT = REPO_ROOT
TYPES = 'feat|fix|docs|refactor|test|perf|build|ci|style|chore'
IDENTIFIER = r'(?:BFF|WEB|DOM|OPS|DEM)-[0-9]{3,}'
TITLE = re.compile(rf'({TYPES})\(({IDENTIFIER})\): (\S(?:.*\S)?)')
DEMAND = re.compile(r'Demande : (DEM-[0-9]{3,})')


def message_fields(message):
    lines = message.splitlines()
    match = TITLE.fullmatch(lines[0] if lines else '')
    if not match:
        raise ValueError('titre attendu : type(CARTE): changement')
    kind, scope, description = match.groups()
    if description.endswith('.') or re.match(r'(?i)(wip|fixup|squash)(?:\b|!)', description):
        raise ValueError('titre provisoire ou point final interdit')
    if description.casefold() == 'corrections diverses':
        raise ValueError('titre imprécis : corrections diverses')
    if len(lines) > 1 and lines[1]:
        raise ValueError('ligne vide requise entre titre et corps')
    fields = [line for line in lines[2:] if re.match(r'\s*Demande\s*:', line)]
    if scope.startswith('DEM-'):
        if kind != 'docs':
            raise ValueError('scope DEM réservé aux commits docs')
        if fields and fields != [f'Demande : {scope}']:
            raise ValueError('référence de demande contradictoire ou dupliquée')
        return scope, scope
    if len(fields) != 1 or not DEMAND.fullmatch(fields[0]):
        raise ValueError('une ligne Demande : DEM-NNN requise pour une carte')
    return scope, DEMAND.fullmatch(fields[0])[1]


def git(root, *args):
    result = subprocess.run(['git', '-C', str(root), *args], capture_output=True)
    if result.returncode:
        raise ValueError(f'Git {args[0]} : {result.stderr.decode("utf-8", errors="replace").strip()}')
    return result.stdout.decode('utf-8')


def resolve(root, ref):
    return git(root, 'rev-parse', '--verify', '--end-of-options', ref + '^{commit}').strip()


def document(root, head, paths, identifier, directory):
    pattern = re.compile(rf'{re.escape(directory)}/{re.escape(identifier)}-[^/]+\.md')
    matches = [path for path in paths if pattern.fullmatch(path)]
    if len(matches) != 1:
        raise ValueError(f'{identifier} : document absent ou identifiant ambigu')
    mode = git(root, 'ls-tree', head, '--', matches[0]).split()[0]
    if mode != '100644' and mode != '100755':
        raise ValueError(f'{identifier} : document non régulier')
    return git(root, 'show', f'{head}:{matches[0]}')


def references(root, head, paths, scope, demand):
    document(root, head, paths, demand, 'dev-book/demand')
    if scope != demand:
        card = document(root, head, paths, scope, 'dev-book/tasks')
        # La ligne de rattachement appartient aux métadonnées de la carte.
        metadata = re.split(r'^##\s', card, maxsplit=1, flags=re.M)[0]
        lines = [line for line in metadata.splitlines()
                 if re.match(r'^- (?:\*\*)?Demande(?:\*\*)?\s*:', line)]
        ids = re.findall(r'DEM-[0-9]{3,}', '\n'.join(lines))
        if not ids or set(ids) != {demand}:
            raise ValueError(f'{scope} : rattachement à {demand} absent ou contradictoire')


def check_range(root, base, head):
    if git(root, 'rev-parse', '--is-shallow-repository').strip() != 'false':
        raise ValueError('historique superficiel : récupérer la plage complète')
    base, head = resolve(root, base), resolve(root, head)
    git(root, 'merge-base', base, head)  # Deux histoires sans ancêtre commun sont une erreur.
    commits = git(root, 'rev-list', '--reverse', f'{base}..{head}').splitlines()
    paths = git(root, 'ls-tree', '-r', '--name-only', '-z', head).split('\0')
    errors = []
    for sha in commits:
        try:
            if len(git(root, 'rev-list', '--parents', '-n', '1', sha).split()) != 2:
                raise ValueError('commit de fusion ou racine interdit dans la nouvelle plage')
            scope, demand = message_fields(git(root, 'show', '-s', '--format=%B', sha))
            references(root, head, paths, scope, demand)
            if scope.startswith('DEM-'):
                changed = git(root, 'diff-tree', '--no-commit-id', '--name-only', '-r', '-z', sha).split('\0')
                for name in filter(None, changed):
                    path = PurePosixPath(name)
                    if path.parent.as_posix() not in ('dev-book/demand', 'dev-book/tasks') or path.suffix != '.md':
                        raise ValueError(f'scope DEM : fichier hors traces documentaires : {name}')
        except ValueError as exc:
            errors.append(f'{sha} : {exc}')
    return errors, len(commits)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--message-file', type=Path, help='format uniquement, avant commit')
    parser.add_argument('--base', help='base exclue de la plage')
    parser.add_argument('--head', default='HEAD')
    args = parser.parse_args(argv)
    if bool(args.message_file) == bool(args.base):
        parser.error('choisir --message-file ou --base [--head]')
    try:
        if args.message_file:
            message_fields(args.message_file.read_text(encoding='utf-8'))
            print('Format du message conforme ; références et contenu non vérifiés.')
            return 0
        errors, count = check_range(ROOT, args.base, args.head)
        if errors:
            print('\n'.join(errors), file=sys.stderr)
            return 1
        print(f'Plage contrôlée : {count} commits.')
        return 0
    except (OSError, ValueError, UnicodeError) as exc:
        print(f'Contrôle des commits impossible : {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
