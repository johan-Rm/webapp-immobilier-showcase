#!/usr/bin/env python3
"""Prépare explicitement le seul dossier de projection de la couche, sans liens symboliques."""
import argparse
from pathlib import Path
import stat


def projection_directory(root, prepare=False):
    current = Path(root)
    for part in ['webapp', '.data', 'saas-projection']:
        current = current / part
        try:
            mode = current.lstat().st_mode
        except FileNotFoundError:
            if not prepare:
                raise ValueError('Dossier absent : lancer make dev-saas-project-prepare.') from None
            current.mkdir(mode=0o755)
            mode = current.lstat().st_mode
        if stat.S_ISLNK(mode) or not stat.S_ISDIR(mode):
            raise ValueError('Chemin de projection non autorisé : ' + str(current))
    return current


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prepare', action='store_true')
    args = parser.parse_args()
    try:
        projection_directory(Path(__file__).resolve().parents[2], args.prepare)
    except ValueError as error:
        parser.exit(1, str(error) + '\n')


if __name__ == '__main__':
    main()
