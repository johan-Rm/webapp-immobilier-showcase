"""Contrat du contrôle des demandes sur des documents temporaires."""
from pathlib import Path as _Path
import sys as _sys
_common = _Path(__file__).resolve().parent
if not (_common / 'bootstrap.py').is_file():
    _common = next((p / 'codebase-integrity/commun' for p in _Path(__file__).resolve().parents if (p / 'codebase-integrity/commun').is_dir()), _common)
_sys.path.insert(0, str(_common))
from bootstrap import REPO_ROOT, configure_imports
configure_imports()

import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('check_demands', Path(__file__).resolve().parents[1] / 'scripts/check_demands.py')
demands = importlib.util.module_from_spec(spec)
spec.loader.exec_module(demands)


class DemandTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'dev-book/demand').mkdir(parents=True)
        self.path = self.root / 'dev-book/demand/DEM-001-example.md'

    def write(self, text):
        self.path.write_text(text, encoding='utf-8')

    def test_valid_types_and_body_examples(self):
        for value in ('développement', 'consolidation', 'développement.', 'consolidation.'):
            with self.subTest(value=value):
                self.write(f'# Exemple\n\n- Type : {value}\n\n## Corps\n```md\n- Type : exemple\n```\n')
                self.assertEqual(demands.check(self.root), [])

    def test_missing_unknown_duplicate_and_noncanonical_fields(self):
        for fields in ('', '- Type : autre', '- Type : consolidation..',
                       '- Type : consolidation\n- Type : consolidation',
                       '- Type : consolidation\n- Type : développement',
                       '* Type : consolidation', '- Type: consolidation'):
            with self.subTest(fields=fields):
                self.write(f'# Exemple\n\n{fields}\n\n## Corps\n')
                self.assertEqual(len(demands.check(self.root)), 1)

    def test_examples_cannot_supply_the_metadata(self):
        for text in ('# Exemple\n```md\n- Type : consolidation\n```\n',
                     '# Exemple\n~~~md\n- Type : consolidation\n~~~\n',
                     '# Exemple\n## Corps\n- Type : consolidation\n'):
            with self.subTest(text=text):
                self.write(text)
                self.assertTrue(demands.check(self.root))

    def test_fenced_heading_does_not_end_metadata(self):
        self.write('# Exemple\n````md\n## Exemple\n```\n- Type : autre\n````\n- Type : consolidation\n')
        self.assertEqual(demands.check(self.root), [])

    def test_all_demands_require_a_type_regardless_of_age_or_name(self):
        self.write('# Historique\n')
        self.assertTrue(demands.check(self.root))
        self.path.rename(self.path.with_name('DEM-999-renamed.md'))
        self.assertTrue(demands.check(self.root))
        self.path = self.path.with_name('DEM-999-renamed.md')
        self.write('# Historique\n- Type : développement\n')
        self.assertEqual(demands.check(self.root), [])

    def test_missing_directory_fails(self):
        self.path.parent.rmdir()
        with self.assertRaises(ValueError):
            demands.check(self.root)

    def test_read_errors_and_invalid_encoding_are_failures(self):
        self.write('# Exemple\n- Type : consolidation\n')
        with patch.object(Path, 'read_bytes', side_effect=PermissionError('refus')):
            self.assertIn('refus', demands.check(self.root)[0])
        self.path.write_bytes(b'\xff')
        self.assertTrue(demands.check(self.root))

    def test_excluded_files_and_worktrees_are_not_scanned(self):
        (self.path.parent / 'analyse.md').write_text('# Analyse\n')
        for prefix in ('tmp', 'worktree/api/dev-book/demand'):
            directory = self.root / prefix
            directory.mkdir(parents=True)
            (directory / 'DEM-999-example.md').write_text('# Hors portée\n')
        self.assertEqual(demands.check(self.root), [])

    def test_symlink_is_refused(self):
        target = self.root / 'other.md'
        target.write_text('# Historique\n')
        self.path.symlink_to(target)
        self.assertTrue(demands.check(self.root))


if __name__ == '__main__':
    unittest.main()
