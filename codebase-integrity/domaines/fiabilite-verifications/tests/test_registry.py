"""Un registre ne doit pas annoncer de domaine, source ou contrôle inexistant."""
from pathlib import Path as _Path
import sys as _sys
_common = _Path(__file__).resolve().parent
if not (_common / 'bootstrap.py').is_file():
    _common = next((p / 'codebase-integrity/commun' for p in _Path(__file__).resolve().parents if (p / 'codebase-integrity/commun').is_dir()), _common)
_sys.path.insert(0, str(_common))
from bootstrap import REPO_ROOT, configure_imports
configure_imports()

import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import check_registry as registry


class Registry(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory(prefix='aide-registry-')
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        (self.root / 'README.md').write_text('# Exemple\n\n## Conventions techniques\n\n### Exigence\n\nRègle locale.\n')
        (self.root / 'check.py').write_text('# contrôle de test\n')
        self.data = {'version': 1, 'domaines': {'architecture': 'Architecture'}, 'conventions': [{
            'id': 'exigence', 'nom': 'Exigence', 'domaine': 'architecture',
            'source': 'README.md#exigence', 'controles': [{
                'id': 'controle', 'etat': 'implémenté', 'mode': 'automatique',
                'fichier': 'check.py', 'limite': 'Portée explicitement limitée.'}]}]}

    def test_existing_and_missing_controls_are_distinguished(self):
        registry.validate(self.root, self.data)
        point = self.data['conventions'][0]['controles'][0]
        point.update(etat='à implémenter', fichier=None)
        registry.validate(self.root, self.data)

    def test_one_known_domain_is_required(self):
        for domain in ['inconnu', ['architecture'], None]:
            with self.subTest(domain=domain):
                self.data['conventions'][0]['domaine'] = domain
                with self.assertRaises(ValueError): registry.validate(self.root, self.data)

    def test_duplicate_convention_or_source_is_rejected(self):
        self.data['conventions'].append(copy.deepcopy(self.data['conventions'][0]))
        with self.assertRaises(ValueError): registry.validate(self.root, self.data)
        self.data['conventions'][1]['id'] = 'autre'
        with self.assertRaises(ValueError): registry.validate(self.root, self.data)

    def test_source_must_be_in_a_readme_convention_chapter(self):
        for reference in ['README.md#absente', 'README.md#exemple', 'README.md', '../README.md#exigence']:
            self.data['conventions'][0]['source'] = reference
            with self.assertRaises(ValueError): registry.validate(self.root, self.data)

    def test_implemented_control_file_must_exist(self):
        (self.root / 'check.py').unlink()
        with self.assertRaisesRegex(ValueError, 'Fichier absent'): registry.validate(self.root, self.data)

    def test_pending_control_cannot_claim_an_existing_file(self):
        self.data['conventions'][0]['controles'][0]['etat'] = 'à implémenter'
        with self.assertRaises(ValueError): registry.validate(self.root, self.data)

    def test_unknown_state_or_missing_limit_is_rejected(self):
        point = self.data['conventions'][0]['controles'][0]
        point['etat'] = 'conforme'
        with self.assertRaises(ValueError): registry.validate(self.root, self.data)
        point['etat'] = 'implémenté'
        point['limite'] = ''
        with self.assertRaises(ValueError): registry.validate(self.root, self.data)

    def test_json_duplicate_keys_are_rejected(self):
        with self.assertRaises(ValueError):
            json.loads('{"version":1,"version":2}', object_pairs_hook=registry.unique)


if __name__ == '__main__':
    unittest.main()
