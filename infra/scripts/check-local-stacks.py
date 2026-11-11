#!/usr/bin/env python3
"""Sonde cinq piles SSR actives et, en option, le développement dans un snapshot isolé."""
import argparse
import importlib.util
import json
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import tarfile
import tempfile
import time

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('local_ssr', ROOT / 'infra/scripts/check-local-ssr.py')
ssr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ssr)


def run(command, cwd=ROOT):
    return subprocess.check_output(command, cwd=cwd, text=True, stderr=subprocess.STDOUT)


def development(image, timeout):
    run(['docker', 'image', 'inspect', image])
    folder = Path(tempfile.mkdtemp(prefix='dem004-direct-'))
    passed = False
    try:
        archive = folder / 'source.tar'
        with archive.open('wb') as output:
            subprocess.run(['git', 'archive', 'HEAD'], cwd=ROOT, stdout=output, check=True)
        source = folder / 'source'
        source.mkdir()
        with tarfile.open(archive) as contents:
            contents.extractall(source, filter='data')
        for layer, port in [('', 3000), ('web', 19301), ('bff', 19302), ('domaine', 19303), ('devops', 19304)]:
            # Ne jamais arrêter une pile étrangère pour libérer un port.
            with socket.socket() as probe:
                probe.bind(('127.0.0.1', port))
            name = layer or 'preprod'
            tree = folder / name
            shutil.copytree(source, tree)
            env = tree / 'webapp/.env'
            env.write_text(f'AIDE_LAYER={layer}\nWEBAPP_DEV_PORT={port}\n'
                           f'NUXT_SESSION_PASSWORD={secrets.token_urlsafe(48)}\n'
                           'SYMFONY_API_URL=\nSYMFONY_SERVICE_EMAIL=\nSYMFONY_SERVICE_PASSWORD=\n'
                           'ACCOMMODATION_FIXTURES_ENABLED=true\n')
            override = tree / 'dev-test.yml'
            override.write_text('services:\n  webapp-localhost:\n    image: '+json.dumps(image)+'\n'
                                '    environment:\n      SYMFONY_API_URL: ""\n'
                                '      NUXT_SYMFONY_API_URL: ""\n')
            command = ['docker', 'compose', '--project-directory', str(tree), '--env-file', str(env),
                       '-p', 'dem004-direct-'+folder.name.rsplit('-', 1)[-1]+'-'+name,
                       '-f', str(tree/'infra/docker/docker-compose.dev.yml'), '-f', str(override)]
            try:
                print(f'{name}:{port} : préparation des données fictives', flush=True)
                run(command + ['run', '--rm', '--no-deps', '--pull', 'never',
                               'webapp-localhost', 'bun', 'run', 'setup:local'], tree)
                run(command + ['up', '-d', '--no-build', '--pull', 'never', 'webapp-localhost'], tree)
                deadline = time.monotonic() + timeout
                last_error = None
                while time.monotonic() < deadline:
                    try:
                        status, body = ssr.request(port, f'localhost:{port}', '/fr')
                        if status == 200 and 'Showcase' in body:
                            break
                        last_error = f'HTTP {status}, identité Showcase absente'
                    except OSError as error:
                        last_error = error
                    time.sleep(1)
                else:
                    raise RuntimeError(f'{name}:{port} : {last_error}\n'+run(command+['logs', '--tail', '30'], tree))
                print(f'{name}:{port} : développement direct HTTP 200, identité Showcase présente', flush=True)
            finally:
                run(command + ['down'], tree)
        passed = True
    finally:
        if passed:
            shutil.rmtree(folder)
        else:
            print(f'Snapshot de diagnostic conservé : {folder}', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dev-image', help='image locale de développement ; aucun build ni téléchargement')
    parser.add_argument('--timeout', type=int, default=180)
    args = parser.parse_args()
    for layer, port in [('', 8080), ('web', 19401), ('bff', 19402), ('domaine', 19403), ('devops', 19404)]:
        ssr.check(port, layer)
    if args.dev_image:
        development(args.dev_image, args.timeout)


if __name__ == '__main__':
    main()
