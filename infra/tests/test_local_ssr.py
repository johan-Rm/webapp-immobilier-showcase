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
from unittest.mock import patch

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

    def test_request_does_not_follow_redirects(self):
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(302)
                self.send_header('Location', '/must-not-be-followed')
                self.end_headers()
            def log_message(self, *_args):
                pass
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            status, _ = probe.request(server.server_port, probe.hosts('')[0], '/')
            self.assertEqual(status, 302)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_probe_accepts_isolated_hosts_and_rejects_cross_site_route(self):
        class Handler(BaseHTTPRequestHandler):
            leak = False
            def do_GET(self):
                host = self.headers.get('Host', '').split(':')[0]
                if host not in probe.hosts(''):
                    self.send_response(421)
                    self.end_headers()
                    return
                client = host == probe.hosts('')[1]
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



class ProbesTest(unittest.TestCase):
    def response(self, port, host, path):
        showcase, client = probe.hosts('web')
        host = host.split(':')[0]
        if host == showcase:
            return 200, 'Showcase'
        if host == client:
            return (200, 'Client 2 Immobilier') if path == '/' else (404, '404')
        return 421, ''

    def run_probe(self, change=None):
        def response(port, host, path):
            result = change(host, path) if change else None
            return result if result is not None else self.response(port, host, path)
        with patch.object(probe, 'request', side_effect=response):
            probe.check(19401, 'web')

    def test_valid(self):
        self.run_probe()

    def test_wrong_site(self):
        with self.assertRaisesRegex(ValueError, 'identité SSR'):
            self.run_probe(lambda host, path: (200, 'Showcase') if host.startswith('client2.wt-web') and path == '/' else None)

    def test_redirect_is_not_success(self):
        with self.assertRaisesRegex(ValueError, 'HTTP 302'):
            self.run_probe(lambda host, path: (302, '') if host.startswith('showcase-immobilier.wt-web') else None)

    def test_route_leak(self):
        with self.assertRaisesRegex(ValueError, 'expose une route'):
            self.run_probe(lambda host, path: (200, 'Showcase') if host.startswith('client2.wt-web') and path == '/themes.json' else None)

    def test_old_alias_served(self):
        with self.assertRaisesRegex(ValueError, 'Hôte non autorisé'):
            self.run_probe(lambda host, path: (200, 'Showcase') if host == 'webapp.localhost' else None)

    def test_other_stack_served(self):
        with self.assertRaisesRegex(ValueError, 'Hôte non autorisé'):
            self.run_probe(lambda host, path: (200, 'Showcase') if host == 'client2.wt-bff.localhost' else None)

    def test_unknown_layer(self):
        with self.assertRaisesRegex(ValueError, 'Couche locale inconnue'):
            probe.check(8080, 'unknown')



if __name__ == '__main__':
    unittest.main()
