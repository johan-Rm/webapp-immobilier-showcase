#!/usr/bin/env python3
"""Gérer les espaces documentaires de demande."""
import argparse
import fcntl
import os
from pathlib import Path
import re
import sys

from demand_status import context, scan
from worktrees import git


def demand_branch(identifier, subject=None):
    if not re.fullmatch(r'DEM-[0-9]{3,}', identifier):
        raise ValueError('Identifiant DEM-NNN requis')
    if subject is not None and not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', subject):
        raise ValueError('Sujet descriptif invalide')
    return f'demands/{identifier}' + (f'-{subject}' if subject else '')


def open_demand(cwd, identifier, base, subject=None):
    branch = demand_branch(identifier, subject)
    root, _ = context(cwd)
    lock_path = root / '.git' / ('aide-' + identifier + '.lock')
    flags = os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW
    with os.fdopen(os.open(lock_path, flags, 0o600), 'r+') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        return _open_demand(root, identifier, base, branch, subject)


def _open_demand(root, identifier, base, branch, subject):
    root, records = context(root)
    parents = (root.parent / (root.name + '.worktrees'), root / 'worktree')
    leaf = identifier + (f'-{subject}' if subject else '')
    destination = parents[0] / leaf
    matches = [record for record in records if re.fullmatch(
        r'refs/heads/demands/' + re.escape(identifier) + r'(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?',
        record.get('branch', ''))]
    if len(matches) > 1 or (matches and matches[0].get('branch') != f'refs/heads/{branch}'):
        raise ValueError('Identité de demande ambiguë ou déjà attribuée')
    if matches:
        record = matches[0]
        tree = Path(record['worktree'])
        if (tree.parent not in parents or tree.name != leaf or tree.parent.is_symlink()
                or tree.is_symlink() or record.get('locked') is not None or 'prunable' in record
                or not tree.is_dir()
                or git(tree, 'rev-parse', '--show-toplevel') != str(tree)
                or git(tree, 'rev-parse', '--path-format=absolute', '--git-common-dir') != str(root / '.git')
                or git(tree, 'branch', '--show-current') != branch
                or git(tree, 'status', '--porcelain=v1', '--untracked-files=all')):
            raise ValueError('Espace de demande non réutilisable')
        return tree
    if parents[0].is_symlink() or destination.is_symlink():
        raise ValueError('Destination symbolique refusée')
    demands, _, _ = scan(root)
    refs = git(root, 'for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/remotes', 'refs/demands')
    existing = demands.get(identifier, [])
    reserved_drafts = [doc for doc in existing if doc.source.parent == root / 'tmp']
    if (len(reserved_drafts) > 1 or len(reserved_drafts) != len(existing)
            or any(re.search(r'/demands/' + re.escape(identifier) + r'(?:-|$)', ref) for ref in refs.splitlines())):
        raise ValueError('Identifiant déjà attribué')
    sha = git(root, 'rev-parse', '--verify', '--end-of-options', base + '^{commit}')
    if sha != git(root, 'rev-parse', 'refs/heads/develop'):
        raise ValueError('La base doit correspondre à develop local')
    if destination.exists():
        raise ValueError('Destination déjà occupée')
    parents[0].mkdir(exist_ok=True)
    if parents[0].is_symlink() or not parents[0].is_dir():
        raise ValueError('Parent de destination invalide')
    # Git crée la ref sans force et arbitre les créations concurrentes de la même branche.
    git(root, 'worktree', 'add', '-b', branch, str(destination), sha)
    return destination


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('identifier')
    parser.add_argument('--base', required=True)
    parser.add_argument('--subject')
    args = parser.parse_args()
    try:
        subject = args.subject or None
        if subject is None:
            branch = demand_branch(args.identifier)
            _, records = context(Path.cwd())
            if not any(item.get('branch') == 'refs/heads/' + branch for item in records):
                raise ValueError('Sujet descriptif requis pour une nouvelle demande')
        print(open_demand(Path.cwd(), args.identifier, args.base, subject))
    except (ValueError, OSError) as error:
        print(error, file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
