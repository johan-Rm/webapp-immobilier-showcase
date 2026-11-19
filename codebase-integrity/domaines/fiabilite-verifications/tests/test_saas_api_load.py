import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[4] / 'webapp/scripts/quality/saas_api_load.py'
spec = importlib.util.spec_from_file_location('saas_api_load', SCRIPT)
load = importlib.util.module_from_spec(spec)
spec.loader.exec_module(load)


class SaasLoadTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.session = self.root / 'session'
        self.session.write_text('A' * 43)
        self.session.chmod(0o600)
        self.env = {'GD_TARGET': 'dashboard', 'QUALITY_BASE_URL': 'http://127.0.0.1:19305',
                    'QUALITY_PROJECT_ID': '11111111-1111-4111-8111-111111111111',
                    'QUALITY_ARTICLE_ID': '22222222-2222-4222-8222-222222222222',
                    'QUALITY_SESSION_FILE': str(self.session)}

    def test_refuses_missing_or_unexpected_configuration(self):
        for key, value in [('GD_TARGET', 'showcase-immobilier'), ('QUALITY_BASE_URL', 'http://example.com:80'),
                           ('QUALITY_BASE_URL', 'http://127.0.0.1:3000/path'), ('QUALITY_PROJECT_ID', ''),
                           ('QUALITY_ARTICLE_ID', 'bad'), ('QUALITY_SESSION_FILE', ''), ('QUALITY_LOAD_PROFILE', 'heavy')]:
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                load.configuration({**self.env, key: value})
        self.session.chmod(0o644)
        with self.assertRaises(ValueError):
            load.configuration(self.env)
        self.session.unlink()
        self.session.symlink_to(self.root / 'missing')
        with self.assertRaises(ValueError):
            load.configuration(self.env)

    def test_rejects_incomplete_failed_or_invalid_metrics(self):
        metrics = {'http_reqs': {'count': 3}, 'checks': {'fails': 0, 'passes': 6},
                   'http_req_failed': {'value': 0}, 'http_req_duration': {'med': 123}}
        self.assertEqual(load.summarize({'metrics': metrics}, 3)['requests'], 3)
        for change in ({'http_reqs': {'count': 0}}, {'checks': {'fails': 1, 'passes': 5}},
                       {'http_req_failed': {'value': 1}}, {'http_req_duration': {'med': float('nan')}}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                load.summarize({'metrics': {**metrics, **change}}, 3)

    def test_failed_scenario_produces_no_report(self):
        with patch.object(load, 'ROOT', self.root), patch.object(load.subprocess, 'run', return_value=SimpleNamespace(returncode=1)):
            with self.assertRaisesRegex(ValueError, 'Scénario list échoué'):
                load.run(self.env)
        self.assertFalse((self.root / '.tmp/quality/saas-api-load').exists())

    def test_two_scenarios_and_sanitized_report_without_docker(self):
        calls = []
        def fake_run(command, **kwargs):
            calls.append(command)
            if command[1] == 'run':
                scenario = next(x.split('=')[1] for x in command if x.startswith('SAAS_SCENARIO='))
                folder = Path(next(x.split(':/reports')[0] for x in command if x.endswith(':/reports')))
                metrics = {'http_reqs': {'count': 3}, 'checks': {'fails': 0, 'passes': 6},
                           'http_req_failed': {'value': 0}, 'http_req_duration': {'med': 123}}
                (folder / f'{scenario}.json').write_text(json.dumps({'metrics': metrics}))
            return SimpleNamespace(returncode=0)
        with patch.object(load, 'ROOT', self.root), patch.object(load.subprocess, 'run', side_effect=fake_run):
            report = load.run(self.env)
        self.assertEqual(set(report['scenarios']), {'list', 'detail'})
        self.assertEqual(len([c for c in calls if c[1] == 'run']), 2)
        self.assertNotIn('A' * 43, repr(calls))
        exported = next((self.root / '.tmp/quality/saas-api-load').glob('*/summary.json')).read_text()
        for secret in ('A' * 43, self.env['QUALITY_PROJECT_ID'], self.env['QUALITY_ARTICLE_ID']):
            self.assertNotIn(secret, exported)
        source = load.SCRIPT.read_text()
        self.assertIn('http.get(', source)
        self.assertNotIn('http.post(', source)
        self.assertNotIn('http.put(', source)
        self.assertNotIn('http.del(', source)


if __name__ == '__main__':
    unittest.main()
