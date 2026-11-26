#!/usr/bin/env python3
"""Vérifie les noms publics runtime dans les références actives identifiées."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[4]
FILES = ('Makefile', 'infra/make/Makefile.dev', 'codebase-integrity/commun/check_presentation.py', 'docs/controles/executer-controles.md')
CURRENT = ('runtime-tests-browser', 'runtime-tests-load', 'runtime-tests-lighthouse')
OBSOLETE = ('internal-tests-browser', 'internal-tests-load', 'third-party-tests-lighthouse', 'test-browser', 'load-check', 'lighthouse-check')


def inspect(root):
    errors = []
    for name in FILES:
        path = root / name
        try:
            content = path.read_text(encoding='utf-8')
        except OSError:
            errors.append(f'Fichier actif absent : {name}')
            continue
        for old in OBSOLETE:
            if re.search(r'(?<![\w-])' + re.escape(old) + r'(?![\w-])', content):
                errors.append(f'Ancien nom {old} dans {name}')
        for required in CURRENT:
            if required not in content:
                errors.append(f'Commande {required} absente de {name}')
    return errors


def main():
    errors = inspect(ROOT)
    for error in errors:
        print(error, file=sys.stderr)
    if errors:
        return 1
    print('Noms runtime conformes dans les références actives contrôlées.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
