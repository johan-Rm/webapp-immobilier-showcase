#!/usr/bin/env python3
"""Préparer et valider l’environnement d’une couche, sans services ni secrets hérités."""
from pathlib import Path as _Path
import sys as _sys
_common = _Path(__file__).resolve().parent
if not (_common / 'bootstrap.py').is_file():
    _common = next((p / 'codebase-integrity/commun' for p in _Path(__file__).resolve().parents if (p / 'codebase-integrity/commun').is_dir()), _common)
_sys.path.insert(0, str(_common))
from bootstrap import REPO_ROOT, configure_imports
configure_imports()

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import sys

from worktrees import context, git


def config(cwd, layer):
    root, records = context(cwd)
    tree = Path(git(cwd, 'rev-parse', '--show-toplevel')).resolve()
    settings = json.loads((tree / 'infra/config/layers.json').read_text())
    layers = settings['layers']
    if layer not in layers or not re.fullmatch('[a-z][a-z0-9-]*', layer):
        raise ValueError('Couche inconnue')
    ids = [item['id'] for item in layers.values()]
    if any(type(number) is not int or number < 1 for number in ids) or len(set(ids)) != len(ids):
        raise ValueError('Identifiants de couches invalides ou dupliqués')
    if git(tree, 'branch', '--show-current') != layers[layer]['branch']:
        raise ValueError('Branche différente de la couche demandée')
    if not any(Path(record['worktree']).resolve() == tree for record in records):
        raise ValueError('Worktree non enregistré')
    project = settings['project']
    if not re.fullmatch('[a-z][a-z0-9-]*', project):
        raise ValueError('Identité de projet invalide')
    instance = hashlib.sha256(str(root).encode()).hexdigest()[:8]
    identity = f'{project}-{instance}-{layer}'
    port = settings['devPortBase'] + layers[layer]['id']
    public_port = settings['publicPortBase'] + layers[layer]['id']
    if not 1024 <= port <= 65535 or not 1024 <= public_port <= 65535 or port == public_port:
        raise ValueError('Ports invalides')
    return tree, identity, port, public_port


def read_values(path):
    values = {}
    for line in path.read_text().splitlines():
        match = re.fullmatch(r'([A-Z][A-Z0-9_]*)=(.*)', line)
        if match:
            key, value = match.groups()
            values[key] = value.strip().strip('\"\'')
    return values


def inside(tree, relative):
    path = tree / relative
    if path.is_absolute() and not path.resolve().is_relative_to(tree):
        raise ValueError('Destination hors du worktree : ' + relative)
    for part in (path, *path.parents):
        if part == tree:
            break
        if part.is_symlink():
            raise ValueError('Lien symbolique dans une destination locale : ' + relative)
    return path


def validate(cwd, layer):
    tree, identity, port, public_port = config(cwd, layer)
    env_path = inside(tree, 'webapp/.env')
    values = read_values(env_path)
    expected = {'COMPOSE_PROJECT_NAME': identity, 'WEBAPP_DEV_PORT': str(port),
                'PUBLIC_PORT': str(public_port), 'AIDE_LAYER': layer}
    for key, value in expected.items():
        if values.get(key) != value:
            raise ValueError(f'{key} incohérent ; environnement existant conservé')
    for key, fallback in [('MEDIA_HOST_DIR', './webapp/public/images'),
                          ('CONTENT_HOST_DIR', './webapp/content'),
                          ('DATA_HOST_DIR', './webapp/.data'),
                          ('CONTENT_SYNC_MEDIA_DIR', './webapp/public/images')]:
        inside(tree, values.get(key) or fallback)
    for relative in ['webapp/.nuxt', 'webapp/.output', 'webapp/.data', 'webapp/.tmp',
                     'webapp/node_modules', 'webapp/schemas/dtos', 'webapp/schemas/interfaces']:
        inside(tree, relative)
    # La source locale des schémas est montée sans écriture dans Compose.
    schema_source = values.get('SCHEMAS_PATH') or './webapp/schemas/source'
    inside(tree, schema_source)
    return tree, values


def prepare_directories(tree, values):
    destinations = [inside(tree, values.get(key) or fallback) for key, fallback in (
        ('MEDIA_HOST_DIR', './webapp/public/images'),
        ('CONTENT_HOST_DIR', './webapp/content'),
        ('DATA_HOST_DIR', './webapp/.data'))]
    destinations.append(inside(tree, 'webapp/.tmp/playwright'))
    for path in destinations:
        path.mkdir(parents=True, exist_ok=True)
        if not os.access(path, os.W_OK):
            raise ValueError('Destination non accessible en écriture : ' + str(path))


def prepare(cwd, layer):
    tree, identity, port, public_port = config(cwd, layer)
    env_path = inside(tree, 'webapp/.env')
    if env_path.exists():
        _, values = validate(cwd, layer)
        prepare_directories(tree, values)
        return env_path, False
    template = inside(tree, 'webapp/.env.example').read_text()
    values = {
        'COMPOSE_PROJECT_NAME': identity,
        'APP_STACK_NETWORK_NAME': identity.replace('-', '_'),
        'EDGE_ALIAS': identity,
        'AIDE_LAYER': layer,
        'DOCKER_UID': str(os.getuid()), 'DOCKER_GID': str(os.getgid()),
        'WEBAPP_DEV_PORT': str(port), 'PUBLIC_PORT': str(public_port),
        'PUBLIC_HOST': 'webapp.localhost', 'SITE_URL': f'http://localhost:{port}',
        'MEDIA_HOST_DIR': './webapp/public/images', 'CONTENT_HOST_DIR': './webapp/content',
        'DATA_HOST_DIR': './webapp/.data', 'SCHEMAS_PATH': '',
        'NUXT_SESSION_PASSWORD': secrets.token_hex(32),
        'SYMFONY_API_URL': '', 'SYMFONY_PROJECT_ID': '',
        'SYMFONY_SERVICE_EMAIL': '', 'SYMFONY_SERVICE_PASSWORD': '',
    }
    for key, value in values.items():
        pattern = re.compile(r'^' + key + r'=.*$', re.M)
        if pattern.search(template):
            template = pattern.sub(lambda _: key + '=' + value, template)
        else:
            template += '\n' + key + '=' + value + '\n'
    # Refuser les destinations dangereuses avant toute création de fichier.
    for relative in ['webapp/content', 'webapp/public/images', 'webapp/.data',
                     'webapp/.nuxt', 'webapp/.tmp', 'webapp/node_modules']:
        inside(tree, relative)
    with open(env_path, 'x', opener=lambda path, flags: os.open(path, flags, 0o600)) as handle:
        handle.write(template)
    _, values = validate(cwd, layer)
    prepare_directories(tree, values)
    return env_path, True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['prepare', 'validate'])
    parser.add_argument('--layer', required=True)
    args = parser.parse_args()
    try:
        if args.command == 'prepare':
            path, created = prepare(Path.cwd(), args.layer)
            print(('Créé' if created else 'Conservé') + ' : ' + str(path))
        else:
            tree, _ = validate(Path.cwd(), args.layer)
            print('Environnement isolé validé : ' + str(tree))
    except (OSError, ValueError, KeyError) as exc:
        parser.exit(1, f'Erreur : {exc}')


if __name__ == '__main__':
    main()
