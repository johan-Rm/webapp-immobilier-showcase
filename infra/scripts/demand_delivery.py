#!/usr/bin/env python3
"""Contrôler la publication ou libérer un espace documentaire livré."""
import argparse
import fcntl
import hashlib
import os
import subprocess
import tempfile
from contextlib import contextmanager
import json
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



def docker(*args):
    try:
        result = subprocess.run(['docker', *args], text=True, capture_output=True, timeout=30)
    except (OSError, subprocess.TimeoutExpired) as error:
        raise ValueError('Docker inaccessible ; ressources conservées') from error
    if result.returncode:
        raise ValueError('Docker a refusé le nettoyage ; ressources restantes conservées')
    return result.stdout.strip()


@contextmanager
def environment_guard(root, identifier, destination):
    """Garder le registre verrouillé pendant le nettoyage et le retrait Git."""
    lock_path = root / '.git' / 'aide-demand-environments.lock'
    with os.fdopen(os.open(lock_path, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600), 'r+') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        registry = root / '.git' / 'aide-demand-environments.json'
        if registry.is_symlink():
            raise ValueError('Registre de ressources symbolique refusé')
        try:
            environments = json.loads(registry.read_text()) if registry.exists() else {}
        except (OSError, json.JSONDecodeError) as error:
            raise ValueError('Registre de ressources illisible ; aucun nettoyage') from error
        if not isinstance(environments, dict):
            raise ValueError('Registre de ressources invalide ; aucun nettoyage')
        entry = environments.get(identifier)
        if identifier in environments and entry is None:
            raise ValueError('Environnement de demande ambigu ; aucun nettoyage')
        if entry is not None:
            if (not isinstance(entry, dict) or entry.get('worktree') != str(destination)
                    or entry.get('host_suffix') != identifier.lower() + '.localhost'
                    or not isinstance(entry.get('ports'), list) or len(entry['ports']) != 5
                    or any(type(port) is not int for port in entry['ports'])):
                raise ValueError('Environnement de demande ambigu ; aucun nettoyage')
        yield entry
        if entry is not None:
            del environments[identifier]
            descriptor, name = tempfile.mkstemp(prefix='.aide-env-', dir=registry.parent)
            try:
                with os.fdopen(descriptor, 'w') as output:
                    json.dump(environments, output, sort_keys=True, indent=2)
                    output.write('\n')
                    output.flush()
                    os.fsync(output.fileno())
                os.replace(name, registry)
            finally:
                if os.path.exists(name):
                    os.unlink(name)


def clean_environment(root, identifier, destination):
    """Nettoyer uniquement des objets Compose identifiés, après contrôle complet."""
    fingerprint = hashlib.sha256(str(root).encode()).hexdigest()[:8]
    prefix = 'showcase-' + fingerprint + '-' + identifier.lower() + '-'
    containers, networks = [], []
    for target in ('site', 'dashboard', 'test'):
        project = prefix + target
        args = ['--filter', 'label=com.docker.compose.project=' + project]
        container_ids = docker('ps', '-aq', *args).splitlines()
        network_ids = docker('network', 'ls', '-q', *args).splitlines()
        if docker('volume', 'ls', '-q', *args):
            raise ValueError('Volume de demande présent ; données conservées')
        if container_ids:
            for item in json.loads(docker('inspect', *container_ids)):
                labels = item.get('Config', {}).get('Labels') or {}
                if (labels.get('com.docker.compose.project') != project
                        or labels.get('com.docker.compose.project.working_dir') != str(destination)):
                    raise ValueError('Conteneur étranger ou ambigu ; aucun nettoyage')
                containers.append((item['Id'], bool(item.get('HostConfig', {}).get('AutoRemove')),
                                   bool(item.get('State', {}).get('Running'))))
        if network_ids:
            for item in json.loads(docker('network', 'inspect', *network_ids)):
                labels = item.get('Labels') or {}
                if labels.get('com.docker.compose.project') != project:
                    raise ValueError('Réseau étranger ou ambigu ; aucun nettoyage')
                networks.append((item['Id'], set((item.get('Containers') or {}).keys())))
    owned = {item[0] for item in containers}
    if any(attached - owned for _, attached in networks):
        raise ValueError('Réseau partagé avec un conteneur étranger ; aucun nettoyage')
    for identifier, auto_remove, running in containers:
        if running:
            docker('stop', '--time', '15', identifier)
        if not auto_remove or not running:
            docker('rm', identifier)
    for identifier, _ in networks:
        docker('network', 'rm', identifier)



def check_local_files(destination):
    """Seul le .env ignoré du worktree de demande peut être retiré par Git."""
    status = git(destination, 'status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored')
    entries = [entry for entry in status.split('\0') if entry]
    if any(entry != '!! webapp/.env' for entry in entries):
        raise ValueError('Espace contenant des fichiers locaux non autorisés')
    env = destination / 'webapp' / '.env'
    if entries:
        if (env.parent.is_symlink() or env.is_symlink() or not env.is_file()
                or env.resolve().parent != (destination / 'webapp').resolve()):
            raise ValueError('Fichier environnement ambigu ; aucun nettoyage')
    elif env.exists() or env.is_symlink():
        raise ValueError('Fichier environnement non ignoré ou ambigu ; aucun nettoyage')


def release(cwd, identifier, target, squash):
    demand_branch(identifier)
    root, records = context(cwd)
    matches = [item for item in records if re.fullmatch(
        r'refs/heads/demands/' + re.escape(identifier) + r'(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?',
        item.get('branch', ''))]
    if len(matches) != 1:
        raise ValueError('Espace de demande absent ou ambigu')
    record = matches[0]
    branch = record['branch'].removeprefix('refs/heads/')
    leaf = branch.removeprefix('demands/')
    target, squash = commit(root, target), commit(root, squash)
    git(root, 'merge-base', '--is-ancestor', squash, target)
    parents = git(root, 'rev-list', '--parents', '-n', '1', squash).split()
    if len(parents) != 2:
        raise ValueError('Le commit livré doit avoir un seul parent')
    destination = root / 'worktree' / leaf
    if (record.get('worktree') != str(destination) or 'locked' in record
            or destination.parent.is_symlink() or destination.is_symlink() or not destination.is_dir()
            or git(destination, 'rev-parse', '--show-toplevel') != str(destination)
            or git(destination, 'branch', '--show-current') != branch
            or Path(cwd).resolve().is_relative_to(destination)):
        raise ValueError('Espace absent, verrouillé ou occupé')
    check_local_files(destination)
    head = commit(root, record['HEAD'])
    publication(root, identifier, parents[1], head)
    tree = git(root, 'merge-tree', '--write-tree', parents[1], head)
    if tree != git(root, 'rev-parse', f'{squash}^{{tree}}'):
        raise ValueError('Le changement intégré diffère de la demande')
    archive = f'refs/demands/archive/{branch}'
    current = git(root, 'for-each-ref', '--format=%(objectname)', archive)
    if current and current != head:
        raise ValueError('Archive existante pour une autre révision')
    with environment_guard(root, identifier, destination) as environment:
        if environment is not None:
            clean_environment(root, identifier, destination)
        if not current:
            git(root, 'update-ref', archive, head, '0' * len(head))
        check_local_files(destination)
        git(root, 'worktree', 'remove', str(destination))
        git(root, 'update-ref', '-d', 'refs/heads/' + branch, head)
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
