#!/usr/bin/env python3
"""Vérifie les métadonnées des demandes, sans Git ni parcours des worktrees."""
from pathlib import Path as _Path
import sys as _sys
_common = _Path(__file__).resolve().parent
if not (_common / 'bootstrap.py').is_file():
    _common = next((p / 'codebase-integrity/commun' for p in _Path(__file__).resolve().parents if (p / 'codebase-integrity/commun').is_dir()), _common)
_sys.path.insert(0, str(_common))
from bootstrap import REPO_ROOT, configure_imports
configure_imports()

from pathlib import Path
import re
import sys


def type_fields(text):
    """Métadonnées avant le premier sous-titre, hors blocs de code clôturés."""
    fields = []
    fence = None
    for line in text.splitlines():
        marker = re.match(r'^ {0,3}(`{3,}|~{3,})(.*)$', line)
        if fence:
            if marker and marker[1][0] == fence[0] and len(marker[1]) >= len(fence) and not marker[2].strip():
                fence = None
            continue
        if marker:
            fence = marker[1]
            continue
        if re.match(r'^#{2,6}\s', line):
            break
        if re.match(r'^\s*[-*+]\s+Type\s*:', line):
            fields.append(line)
    return fields


def check(root):
    directory = root / 'dev-book/demand'
    if not directory.is_dir():
        raise ValueError('dossier dev-book/demand absent')
    errors = []
    for path in sorted(directory.glob('DEM-*.md')):
        name = path.relative_to(root).as_posix()
        try:
            if path.is_symlink():
                raise ValueError('lien symbolique non accepté')
            content = path.read_bytes()
            fields = type_fields(content.decode('utf-8'))
            if len(fields) != 1:
                raise ValueError('un seul champ Type requis dans les métadonnées')
            if fields[0].removesuffix('.') not in ('- Type : développement', '- Type : consolidation'):
                raise ValueError('format ou valeur du champ Type invalide')
        except (OSError, ValueError) as exc:
            errors.append(f'{name} : {exc}')
    return errors


def main():
    root = REPO_ROOT
    try:
        errors = check(root)
    except (OSError, ValueError) as exc:
        print(f'Contrôle des demandes impossible : {exc}', file=sys.stderr)
        return 1
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print('Types des demandes conformes.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
