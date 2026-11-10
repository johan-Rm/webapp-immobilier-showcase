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
