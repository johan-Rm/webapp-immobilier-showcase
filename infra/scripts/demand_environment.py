#!/usr/bin/env python3
"""Réserver une identité locale stable pour les environnements d'une demande."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import tempfile

from demand_worktree import context, git
from environment import inside

PORT_FIRST = 22000
PORT_LAST = 39999
PORTS_PER_DEMAND = 5


def identity(cwd):
    root, records = context(cwd)
    tree = Path(git(cwd, 'rev-parse', '--show-toplevel')).resolve()
    branch = git(tree, 'branch', '--show-current')
    match = re.fullmatch(r'demands/(DEM-[0-9]{3,})-[a-z0-9]+(?:-[a-z0-9]+)*', branch)
    if not match or not any(Path(record['worktree']).resolve() == tree and
                            record.get('branch') == 'refs/heads/' + branch for record in records):
        raise ValueError('Worktree de demande descriptive requis')
    return root, tree, match[1]


def available(ports):
    sockets = []
    try:
        for port in ports:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sockets.append(sock)
            sock.bind(('127.0.0.1', port))
        return True
    except OSError:
        return False
    finally:
        for sock in sockets:
            sock.close()


def reserve(cwd):
    root, tree, demand = identity(cwd)
    registry = root / '.git' / 'aide-demand-environments.json'
    lockfile = root / '.git' / 'aide-demand-environments.lock'
    flags = os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW
    with os.fdopen(os.open(lockfile, flags, 0o600), 'r+') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if registry.is_symlink():
            raise ValueError('Registre symbolique refusé')
        data = json.loads(registry.read_text()) if registry.exists() else {}
        if not isinstance(data, dict):
            raise ValueError('Registre invalide')
        for key, item in data.items():
            if (not re.fullmatch(r'DEM-[0-9]{3,}', key) or not isinstance(item, dict)
                    or not isinstance(item.get('ports'), list) or len(item['ports']) != PORTS_PER_DEMAND
                    or any(type(port) is not int or not PORT_FIRST <= port <= PORT_LAST
                           for port in item['ports']) or not isinstance(item.get('worktree'), str)
                    or item.get('host_suffix') != key.lower() + '.localhost'):
                raise ValueError('Registre invalide')
        allocated = [port for item in data.values() for port in item['ports']]
        if len(allocated) != len(set(allocated)):
            raise ValueError('Ports dupliqués dans le registre')
        if demand in data:
            if data[demand]['worktree'] != str(tree):
                raise ValueError('Identifiant déjà affecté à un autre worktree')
            return data[demand]
        occupied = set(allocated)
        for first in range(PORT_FIRST, PORT_LAST - PORTS_PER_DEMAND + 2, PORTS_PER_DEMAND):
            ports = list(range(first, first + PORTS_PER_DEMAND))
            if not occupied.intersection(ports) and available(ports):
                break
        else:
            raise ValueError('Aucun groupe de ports disponible')
        entry = {'worktree': str(tree), 'ports': ports,
                 'host_suffix': demand.lower() + '.localhost'}
        data[demand] = entry
        descriptor, name = tempfile.mkstemp(prefix='.aide-env-', dir=registry.parent)
        try:
            with os.fdopen(descriptor, 'w') as output:
                json.dump(data, output, sort_keys=True, indent=2)
                output.write('\n')
                output.flush()
                os.fsync(output.fileno())
            os.replace(name, registry)
        finally:
            if os.path.exists(name):
                os.unlink(name)
        return entry


def prepare(cwd):
    """Préparer un fichier privé sans recopier les secrets d'un autre environnement."""
    import secrets
    root, tree, demand = identity(cwd)
    entry = reserve(tree)
    env_path = inside(tree, 'webapp/.env')
    directories = [inside(tree, path) for path in ('webapp/.nuxt', 'webapp/.output',
                   'webapp/.tmp/dashboard-cache', 'webapp/.data/dashboard/saas-sessions',
                   'webapp/.data/dashboard/saas-publication')]
    if env_path.is_symlink():
        raise ValueError('Fichier environnement symbolique refusé')
    if env_path.exists():
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
        return env_path
    source = tree / 'webapp/.env.example'
    template = source.read_text()
    project = 'showcase-' + demand.lower()
    replacements = {
        'COMPOSE_PROJECT_NAME': project, 'APP_STACK_NETWORK_NAME': project.replace('-', '_'),
        'EDGE_ALIAS': project, 'DOCKER_UID': str(os.getuid()), 'DOCKER_GID': str(os.getgid()),
        'WEBAPP_DEV_PORT': str(entry['ports'][0]), 'PUBLIC_PORT': str(entry['ports'][1]),
        'PUBLIC_HOST': 'showcase-immobilier.' + entry['host_suffix'],
        'SITE_URL': 'http://showcase-immobilier.' + entry['host_suffix'] + ':' + str(entry['ports'][1]),
        'NUXT_SESSION_PASSWORD': secrets.token_hex(32),
        'SYMFONY_API_URL': '', 'SYMFONY_PROJECT_ID': '',
        'SYMFONY_SERVICE_EMAIL': '', 'SYMFONY_SERVICE_PASSWORD': '',
    }
    for key, value in replacements.items():
        pattern = re.compile(r'^' + key + r'=.*$', re.M)
        template, count = pattern.subn(lambda _: key + '=' + value, template)
        if count == 0:
            template += '\n' + key + '=' + value + '\n'
        elif count != 1:
            raise ValueError('Variable dupliquée dans le modèle : ' + key)
    with os.fdopen(os.open(env_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY | os.O_NOFOLLOW, 0o600), 'w') as output:
        output.write(template)
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
    return env_path


def compose_run(command, tree, variables):
    import subprocess
    return subprocess.run(command, cwd=tree, env=variables).returncode


def run(cwd, action, target):
    """Piloter uniquement le projet Compose de la demande et de la cible."""
    if target not in ('site', 'dashboard'):
        raise ValueError('Cible attendue : site ou dashboard')
    if action not in ('setup', 'up', 'down', 'logs', 'test-up', 'test-down'):
        raise ValueError('Action inconnue')
    root, tree, demand = identity(cwd)
    fingerprint = hashlib.sha256(str(root).encode()).hexdigest()[:8]
    if action in ('test-up', 'test-down'):
        from lanes import prepare_test_container
        name = 'showcase-' + fingerprint + '-' + demand.lower() + '-test'
        entry = reserve(tree)
        if action == 'test-down' and not prepare_test_container(tree, name):
            raise ValueError('Serveur de test absent ; aucune action effectuée')
        test_target = 'dashboard' if target == 'dashboard' else 'showcase-immobilier'
        return compose_run(['make', '--no-print-directory',
                            'test-up' if action == 'test-up' else 'checks-fixture-stop',
                            'GD_TARGET=' + test_target,
                            'CHECKS_FIXTURE_NAME=' + name,
                            'WEBAPP_TEST_PORT=' + str(entry['ports'][4])], tree,
                           dict(os.environ, COMPOSE_PROJECT_NAME='showcase-' + fingerprint + '-' + demand.lower() + '-test'))
    env_path = tree / 'webapp/.env'
    if action in ('down', 'logs') and not env_path.is_file():
        raise ValueError('Environnement absent ; aucune action effectuée')
    env_path = prepare(tree)
    entry = reserve(tree)
    ports = entry['ports']
    dashboard = target == 'dashboard'
    host = ('dashboard.' if dashboard else 'showcase-immobilier.') + entry['host_suffix']
    variables = dict(os.environ, GD_TARGET='dashboard' if dashboard else 'showcase-immobilier',
                     WEBAPP_DEV_PORT=str(ports[2] if dashboard else ports[0]),
                     PUBLIC_PORT=str(ports[3] if dashboard else ports[1]), DASHBOARD_HOST=host,
                     DEMAND_SITE_URL='http://' + host + ':' + str(ports[3] if dashboard else ports[1]))
    compose_file = ('infra/docker/docker-compose.dashboard-dev.yml' if dashboard
                    else 'infra/docker/docker-compose.demand-dev.yml')
    command = ['docker', 'compose', '--project-name', 'showcase-' + fingerprint + '-' + demand.lower() + '-' + target,
               '--project-directory', str(tree), '--env-file', str(env_path), '-f', compose_file]
    actions = {'setup': ['run', '--rm', '--no-deps', 'webapp-localhost', 'bun', 'run', 'setup:local'],
               'up': ['up', '-d', 'webapp-localhost', 'nginx'], 'down': ['down'],
               'logs': ['logs', '-f', '--tail', '200']}
    print('Environnement : http://' + host + ':' + variables['PUBLIC_PORT'], flush=True)
    return compose_run(command + actions[action], tree, variables)


def main():
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'setup', 'up', 'down', 'logs', 'test-up', 'test-down'])
    parser.add_argument('--target', choices=['site', 'dashboard'], default='site')
    args = parser.parse_args()
    try:
        if args.action == 'prepare':
            print(prepare(Path.cwd()))
            return 0
        return run(Path.cwd(), args.action, args.target)
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        print('Erreur : ' + str(error), file=__import__('sys').stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
