#!/usr/bin/env python3
"""Gérer les espaces documentaires de demande."""
import argparse
from pathlib import Path
import re
import sys

from demand_status import context, scan
from worktrees import git


def demand_branch(identifier):
    if not re.fullmatch(r'DEM-[0-9]{3,}', identifier):
        raise ValueError('Identifiant DEM-NNN requis')
    return f'demands/{identifier}'


def open_demand(cwd, identifier, base):
    branch = demand_branch(identifier)
    root, records = context(cwd)
    parent = root / 'worktree'
    destination = parent / identifier
    if parent.is_symlink() or destination.is_symlink():
        raise ValueError('Destination symbolique refusée')
    for record in records:
        if record.get('branch') == f'refs/heads/{branch}':
            if (Path(record['worktree']) != destination or record.get('locked') is not None
                    or not destination.is_dir()
                    or git(destination, 'rev-parse', '--show-toplevel') != str(destination)
                    or git(destination, 'branch', '--show-current') != branch
                    or git(destination, 'status', '--porcelain=v1', '--untracked-files=all')):
                raise ValueError('Espace de demande non réutilisable')
            return destination
    demands, _, _ = scan(root)
    refs = git(root, 'for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/remotes', 'refs/demands')
    if identifier in demands or any(ref.endswith('/' + branch) for ref in refs.splitlines()):
        raise ValueError('Identifiant déjà attribué')
    sha = git(root, 'rev-parse', '--verify', '--end-of-options', base + '^{commit}')
    if sha != git(root, 'rev-parse', 'refs/heads/develop'):
        raise ValueError('La base doit correspondre à develop local')
    if destination.exists():
        raise ValueError('Destination déjà occupée')
    # Git crée la ref sans force et arbitre les créations concurrentes de la même branche.
    git(root, 'worktree', 'add', '-b', branch, str(destination), sha)
    return destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('identifier')
    parser.add_argument('--base', required=True)
    args = parser.parse_args()
    try:
        print(open_demand(Path.cwd(), args.identifier, args.base))
    except (ValueError, OSError) as error:
        print(error, file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
