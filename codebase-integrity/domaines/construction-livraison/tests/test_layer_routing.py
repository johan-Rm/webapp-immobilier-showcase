"""Vérifier les frontières du routage déclaré, sans modifier Git."""
import json
from pathlib import Path
import unittest

ROOT = next(p for p in Path(__file__).resolve().parents if (p / 'infra/config/layers.json').is_file())

class LayerRouting(unittest.TestCase):
    def test_frontend_and_infrastructure_have_distinct_owners(self):
        config = json.loads((ROOT / 'infra/config/layers.json').read_text())
        def owner(path):
            matches = [(len(prefix), name) for name, layer in config['layers'].items()
                       for prefix in layer.get('paths', []) if path.startswith(prefix)]
            return max(matches)[1] if matches else config['defaultLayer']
        for path in ['webapp/sites/showcase-immobilier/nuxt.config.ts',
                     'webapp/sites/client2-immobilier/app/pages/index.vue',
                     'webapp/base/real-estate/components/screen/Hero.vue']:
            self.assertEqual(owner(path), 'web')
        self.assertEqual(owner('webapp/app/pages/index.vue'), 'devops')
        for path in ['webapp/nuxt.config.ts', 'webapp/base/nuxt.config.ts', 'webapp/base/README.md']:
            self.assertEqual(owner(path), 'devops')
        self.assertEqual(owner('webapp/server/api/probe.ts'), 'bff')
        self.assertEqual(owner('webapp/shared/types/site.ts'), 'domaine')

        for path in ['webapp/dashboard/app/pages/index.vue',
                     'webapp/tests/e2e/saas-access.spec.ts',
                     'webapp/tests/e2e/saas-editor.spec.ts',
                     'webapp/tests/layers/dashboard.vitest.ts']:
            self.assertEqual(owner(path), 'dashboard')
        self.assertEqual(owner('webapp/tests/e2e/other.spec.ts'), 'web')

    def test_stable_identifiers_and_dashboard_runtime_declaration(self):
        layers = json.loads((ROOT / 'infra/config/layers.json').read_text())['layers']
        for name, number, prefix in [('web', 1, 'WEB'), ('bff', 2, 'BFF'),
                                      ('domaine', 3, 'DOM'), ('devops', 4, 'OPS'),
                                      ('dashboard', 5, 'DASH')]:
            self.assertEqual(layers[name]['id'], number)
            self.assertEqual(layers[name]['prefix'], prefix)
            self.assertEqual(layers[name]['branch'], 'layers/' + name)
        self.assertEqual(layers['dashboard']['devComposeFile'],
                         'infra/docker/docker-compose.dashboard-dev.yml')
        self.assertEqual(layers['dashboard']['devServices'], ['webapp-localhost', 'nginx'])
        for name in ('web', 'bff', 'domaine', 'devops'):
            self.assertNotIn('devComposeFile', layers[name])
            self.assertNotIn('devServices', layers[name])
