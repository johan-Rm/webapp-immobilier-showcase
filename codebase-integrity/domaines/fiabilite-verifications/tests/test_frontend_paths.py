"""La source des conventions frontend suit son déplacement, sans exception de lien."""
from pathlib import Path as _Path
import sys as _sys
_common = next(p / 'codebase-integrity/commun' for p in _Path(__file__).resolve().parents if (p / 'codebase-integrity/commun').is_dir())
_sys.path.insert(0, str(_common))
from bootstrap import REPO_ROOT, configure_imports
configure_imports()

import copy
import json
from pathlib import Path
import tempfile
import unittest
import check_registry as registry

class FrontendPaths(unittest.TestCase):
    def test_registry_moves_the_source_without_dropping_conventions(self):
        data = json.loads((REPO_ROOT / 'codebase-integrity/conventions.json').read_text())
        app = [item for item in data['conventions'] if item['source'].startswith('webapp/sites/showcase-immobilier/app/README.md#')]
        self.assertGreater(len(app), 5)
        self.assertFalse(any(item['source'].startswith('webapp/app/') for item in data['conventions']))

    def test_renamed_source_is_required_even_when_the_old_source_exists(self):
        data = json.loads((REPO_ROOT / 'codebase-integrity/conventions.json').read_text())
        item = copy.deepcopy(next(item for item in data['conventions'] if item['id'] == 'app-no-redundant-guards'))
        data['conventions'] = [item]
        with tempfile.TemporaryDirectory(prefix='frontend-reference-') as directory:
            root = Path(directory)
            content = '# Application\n\n## Conventions techniques\n\n### Sur-vérification des variables\n\nRègle témoin.\n'
            for name in ['webapp/app/README.md', item['source'].split('#')[0]]:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content)
            for control in item['controles']:
                if control.get('fichier'):
                    path = root / control['fichier']
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_text('# témoin\n')
            registry.validate(root, data)
            (root / item['source'].split('#')[0]).unlink()
            with self.assertRaises(ValueError):
                registry.validate(root, data)
