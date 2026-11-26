#!/usr/bin/env python3
"""Contrôler la publication ou libérer un espace documentaire livré."""
import argparse
from pathlib import Path
import re
import sys

from demand_worktree import context, demand_branch, git

DEMAND_FILE = re.compile(r'dev-book/demand/(DEM-[0-9]{3,})-[^/]+\.md')
CARD_FILE = re.compile(r'dev-book/tasks/(?:OPS|WEB|BFF|DOM|DASH)-[0-9]+-[^/]+\.md')
DEMAND_FIELD = re.compile(r'^- Demande\s*:\s*`?(DEM-[0-9]{3,})\b', re.M)


def commit(root, sha):
    if not re.fullmatch(r'[0-9a-f]{40}', sha):
        raise ValueError('SHA Git complet requis')
    return git(root, 'rev-parse', '--verify', f'{sha}^{{commit}}')


def paths(root, sha, directory):
    return set(git(root, 'ls-tree', '-r', '--name-only', sha, '--', directory).splitlines())


def demands(root, sha):
    documents = {}
    for path in paths(root, sha, 'dev-book/demand'):
        match = DEMAND_FILE.fullmatch(path)
        if match:
            identifier = match[1]
            if identifier in documents:
                raise ValueError(f'Identité de demande ambiguë : {identifier}')
            documents[identifier] = path
    return documents


def assert_identity(root, head, identifier, path):
    if not path:
        raise ValueError(f'Demande définitive absente : {identifier}')
    text = git(root, 'show', f'{head}:{path}')
    if (not re.match(rf'^# {identifier}\b', text)
            or len(re.findall(r'^- Type\s*:\s*(?:développement|consolidation)\b', text, re.M)) != 1):
        raise ValueError(f'Identité ou type invalide : {path}')


def publication(root, identifier, target, head):
    demand_branch(identifier)
    target, head = commit(root, target), commit(root, head)
    if identifier in demands(root, target):
        raise ValueError(f'Collision sur la cible : {identifier}')
    candidates = demands(root, head)
    assert_identity(root, head, identifier, candidates.get(identifier))
    ancestor = git(root, 'merge-base', target, head)
    existing = paths(root, ancestor, 'dev-book/tasks')
    target_cards = paths(root, target, 'dev-book/tasks')
    for path in sorted(paths(root, head, 'dev-book/tasks') - existing):
        if CARD_FILE.fullmatch(path):
            if path in target_cards:
                raise ValueError(f'Collision de carte sur la cible : {path}')
            linked = DEMAND_FIELD.findall(git(root, 'show', f'{head}:{path}'))
            if linked != [identifier]:
                raise ValueError(f'Carte sans rattachement à {identifier} : {path}')


def release(cwd, identifier, target, squash):
    branch = demand_branch(identifier)
    root, records = context(cwd)
    target, squash = commit(root, target), commit(root, squash)
    git(root, 'merge-base', '--is-ancestor', squash, target)
    parents = git(root, 'rev-list', '--parents', '-n', '1', squash).split()
    if len(parents) != 2:
        raise ValueError('Le commit livré doit avoir un seul parent')
    record = next((item for item in records if item.get('branch') == f'refs/heads/{branch}'), {})
    destination = root / 'worktree' / identifier
    if (record.get('worktree') != str(destination) or 'locked' in record
            or destination.parent.is_symlink() or destination.is_symlink() or not destination.is_dir()
            or git(destination, 'rev-parse', '--show-toplevel') != str(destination)
            or git(destination, 'branch', '--show-current') != branch
            or Path(cwd).resolve().is_relative_to(destination)
            or git(destination, 'status', '--porcelain=v1', '--untracked-files=all', '--ignored')):
        raise ValueError('Espace absent, verrouillé, occupé ou contenant des fichiers locaux')
    head = commit(root, record['HEAD'])
    publication(root, identifier, parents[1], head)
    tree = git(root, 'merge-tree', '--write-tree', parents[1], head)
    if tree != git(root, 'rev-parse', f'{squash}^{{tree}}'):
        raise ValueError('Le changement intégré diffère de la demande')
    archive = f'refs/demands/archive/{branch}'
    current = git(root, 'for-each-ref', '--format=%(objectname)', archive)
    if current and current != head:
        raise ValueError('Archive existante pour une autre révision')
    if not current:
        git(root, 'update-ref', archive, head, '0' * len(head))
    # Sans force, Git revérifie les fichiers et le verrou avant la suppression.
    git(root, 'worktree', 'remove', str(destination))
    return archive


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_subparsers(dest='mode', required=True)
    for name, evidence in [('publication', 'head'), ('release', 'squash')]:
        command = modes.add_parser(name)
        command.add_argument('identifier')
        command.add_argument('--target', required=True)
        command.add_argument('--' + evidence, required=True)
    args = parser.parse_args()
    try:
        if args.mode == 'publication':
            publication(Path.cwd(), args.identifier, args.target, args.head)
            print('Publication contrôlée sur la cible fournie.')
        else:
            print(release(Path.cwd(), args.identifier, args.target, args.squash))
    except (ValueError, OSError, KeyError) as error:
        print(error, file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
