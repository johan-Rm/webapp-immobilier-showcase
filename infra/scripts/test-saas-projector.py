#!/usr/bin/env python3
"""Test HTTP et disque du worker Docker, fixtures locales sans API ni secrets réels."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from saas_projection_path import projection_directory


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--image', default='dem005-ops012-projector:local')
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='saas-path-') as directory:
        root = Path(directory)
        assert projection_directory(root, True) == root / 'webapp/.data/saas-projection'
        projection_directory(root)
        path = root / 'webapp/.data/saas-projection'
        path.rmdir()
        path.symlink_to(root, target_is_directory=True)
        try:
            projection_directory(root, True)
        except ValueError:
            pass
        else:
            raise AssertionError('Lien symbolique accepté')
    project = '10000000-0000-4000-8000-000000000001'
    media = '10000000-0000-4000-8000-000000000003'
    secret = 'fixture-worker-secret-not-real-123456789'
    png = bytes([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3])
    state = {'generation': 1, 'bad_image': False, 'acks': [], 'images': 0, 'requests': 0}
    entries = []
    for locale, suffix in [('fr', '4'), ('en', '5')]:
        article = dict(id='10000000-0000-4000-8000-000000000002', projectId=project,
                       snapshotId='10000000-0000-4000-8000-00000000000' + suffix,
                       publishedAt='2026-11-12T10:00:00.000Z', locale=locale, headline='Titre',
                       slug='titre', summary='Résumé', primaryImage={'mediaId': media, 'alt': 'Photo'},
                       metaTitle='SEO', metaDescription='Description',
                       content={'schemaVersion': 1, 'blocks': []}, categories=[])
        entries.append({'article': article, 'assets': [dict(id=media, sourcePath='/images/a.png', mimeType='image/png')]})

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def reply(self, value, status=200):
            data = json.dumps(value).encode()
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            state['requests'] += 1
            if self.path == '/images/a.png':
                assert self.headers.get('Authorization') is None, 'secret envoyé au serveur image'
                state['images'] += 1
                self.send_response(200)
                self.send_header('Content-Type', 'image/png')
                self.end_headers()
                self.wfile.write(b'invalid' if state['bad_image'] else png)
            elif self.path == f'/api/saas/projects/{project}/publication/queue':
                assert self.headers.get('Authorization') == 'Bearer ' + secret
                self.reply(dict(schemaVersion=1, projectId=project, target='client2-immobilier',
                                sourceOrigin=origin, generation=state['generation'],
                                appliedGeneration=0, entries=entries, commands=[]))
            else:
                self.reply({}, 404)

        def do_POST(self):
            assert self.path == f'/api/saas/projects/{project}/publication/ack'
            assert self.headers.get('Authorization') == 'Bearer ' + secret
            assert self.headers.get('Origin') == 'https://dashboard.example.com'
            value = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            state['acks'].append(value)
            self.reply(value)

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    origin = f'http://127.0.0.1:{server.server_port}'
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with tempfile.TemporaryDirectory(prefix='saas-projector-http-') as directory:
            root = Path(directory)
            command = ['docker', 'run', '--rm', '--pull', 'never', '--network', 'host', '--read-only',
                       '--user', f'{os.getuid()}:{os.getgid()}', '--cap-drop', 'ALL',
                       '--security-opt', 'no-new-privileges:true',
                       '--volume', f'{root}:/app/.data/saas-projection']
            env = dict(SAAS_PROJECTION_PROJECT_ID=project, SAAS_PROJECTION_SECRET=secret,
                       SAAS_DASHBOARD_URL=origin, SAAS_DASHBOARD_ORIGIN='https://dashboard.example.com',
                       SAAS_PROJECTION_SOURCE_ORIGIN=origin)
            for key, value in env.items():
                command.extend(['--env', key + '=' + value])
            command.extend([args.image, 'bun', '--no-env-file', 'scripts/saas/project.ts'])

            def run(flag='--once', success=True):
                result = subprocess.run(command + [flag], text=True, capture_output=True, timeout=40)
                assert (result.returncode == 0) == success, result.stderr
                return json.loads(result.stdout if success else result.stderr)

            assert run('--dry-run')['state'] == 'dry-run'
            assert list(root.iterdir()) == [] and not state['acks'] and not state['images']
            assert run()['state'] == 'applied'
            pointer = root / 'client2-immobilier/current.json'
            initial = pointer.read_bytes()
            current = json.loads(initial)
            release = root / 'client2-immobilier/releases' / current['release']
            manifest_bytes = (release / 'manifest.json').read_bytes()
            assert hashlib.sha256(manifest_bytes).hexdigest() == current['version']
            manifest = json.loads(manifest_bytes)
            assert len(manifest['indexes']['fr']) == len(manifest['indexes']['en']) == 1
            assert manifest['media'][0]['sha256'] == hashlib.sha256(png).hexdigest()
            count = state['images']
            assert run()['state'] == 'applied' and state['images'] == count
            state.update(generation=2, bad_image=True)
            assert run(success=False)['code'] == 'asset_unavailable'
            assert pointer.read_bytes() == initial and state['acks'][-1]['state'] == 'failed'
            state['bad_image'] = False
            entries[:] = entries[:1]
            assert run()['generation'] == 2
            current = json.loads(pointer.read_bytes())
            latest = json.loads((pointer.parent / 'releases' / current['release'] / 'manifest.json').read_bytes())
            assert latest['indexes']['en'] == []
            state['generation'] = 3
            entries.clear()
            assert run()['articles'] == 0
            assert (release / 'manifest.json').read_bytes() == manifest_bytes
            print('Worker Docker : dry-run, HTTP authentifié, médias, reprise, idempotence et dépublication conformes.')
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


if __name__ == '__main__':
    main()
