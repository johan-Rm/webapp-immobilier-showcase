"""Contrôles Compose et sondes HTTP ; aucune pile utilisateur modifiée."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
from threading import Thread
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('local_ssr', ROOT / 'infra/scripts/check-local-ssr.py')
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)

class LocalSSR(unittest.TestCase):
    def test_compose_targets_secrets_and_volumes(self):
        with tempfile.TemporaryDirectory(prefix='ssr-compose-') as directory:
            root = Path(directory)
            (root / 'webapp').mkdir()
            (root / 'webapp/.env').write_text('SYMFONY_SERVICE_PASSWORD=test-sentinel\n')
            compose = root / 'compose.yml'
            shutil.copyfile(ROOT / 'infra/docker/docker-compose.dev.yml', compose)
            result = subprocess.run(['docker', 'compose', '--project-directory', str(root),
                '--env-file', str(root / 'webapp/.env'), '-f', str(compose), 'config', '--format', 'json'],
                check=True, capture_output=True, text=True)
            config = json.loads(result.stdout)['services']
            showcase, client = config['webapp-ssr'], config['client2-ssr']
            self.assertEqual(showcase['build']['args']['GD_TARGET'], 'showcase-immobilier')
            self.assertEqual(client['build']['args']['GD_TARGET'], 'client2-immobilier')
            self.assertNotEqual(showcase['image'], client['image'])
            self.assertEqual(showcase['environment']['SYMFONY_SERVICE_PASSWORD'], 'test-sentinel')
            self.assertNotIn('test-sentinel', json.dumps(client))
            self.assertFalse(client.get('volumes'))
            self.assertEqual(set(config['nginx']['depends_on']), {'webapp-ssr', 'client2-ssr'})
            self.assertFalse(any(volume['target'] == '/app/app' for volume in config['webapp-localhost']['volumes']))
            for volume in showcase['volumes']:
                self.assertNotIn('client2-immobilier', volume['source'])

    def test_probe_accepts_isolated_hosts_and_rejects_cross_site_route(self):
        class Handler(BaseHTTPRequestHandler):
            leak = False
            def do_GET(self):
                client = self.headers.get('Host') == 'client2-immobilier.localhost'
                missing = client and self.path != '/' and not self.leak
                self.send_response(404 if missing else 200)
                self.end_headers()
                self.wfile.write(('Client 2 Immobilier 404' if client else 'Showcase').encode())
            def log_message(self, *_args):
                pass
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            probe.check(server.server_port)
            Handler.leak = True
            with self.assertRaisesRegex(ValueError, 'expose une route Showcase'):
                probe.check(server.server_port)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

if __name__ == '__main__':
    unittest.main()
