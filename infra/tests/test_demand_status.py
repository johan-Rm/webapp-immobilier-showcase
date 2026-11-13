"""Demandes locales : sources contradictoires, clôtures et filtres."""
import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('demand_status', ROOT / 'infra/scripts/demand_status.py')
status = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = status
spec.loader.exec_module(status)


class DemandStatus(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='demand espace ')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.main = self.root / 'main'
        self.lane = self.main / 'worktree/devops'
        for root in [self.main, self.lane]:
            for folder in ['dev-book/demand', 'dev-book/tasks']:
                (root / folder).mkdir(parents=True)
        (self.main / 'tmp').mkdir()
        self.records = [{'worktree': str(self.main)}, {'worktree': str(self.lane)}]

    def doc(self, relative, text):
        path = self.main / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        return path

    def demand(self, state='en cours'):
        return '# DEM-042 — Une demande\n\n- État : ' + state + '\n'

    def task(self, state='bloquée'):
        return ('# OPS-099 — Une carte\n\n- Demande : DEM-042 ; type : développement\n'
                '- Couche : devops\n- État : ' + state + '\n')

    def scan(self):
        with patch.object(status, 'context', return_value=(self.main, self.records)):
            return status.scan(self.lane)

    def test_scan_principal_tmp_untracked_and_deduplicate(self):
        self.doc('tmp/demande-test.md', self.demand())
        for prefix in ['', 'worktree/devops/']:
            self.doc(prefix + 'dev-book/tasks/OPS-099-test.md', self.task())
        demands, tasks, warnings = self.scan()
        output = status.render(demands, tasks, 'tasks')
        self.assertEqual(output.count('OPS-099 |'), 1)
        self.assertIn('bloquée', output)
        self.assertIn(str(self.lane), output)
        self.assertFalse(warnings)
        self.assertFalse((self.main / '.git').exists())

    def test_partial_states_and_conflicts_are_preserved(self):
        self.doc('tmp/demande-test.md', self.demand())
        self.doc('dev-book/tasks/OPS-099-test.md', self.task('partiellement validée'))
        self.doc('worktree/devops/dev-book/tasks/OPS-099-test.md', self.task('non prête'))
        demands, tasks, _ = self.scan()
        output = status.render(demands, tasks, 'tasks')
        for value in ['divergents', 'partiellement validée', 'non prête']:
            self.assertIn(value, output)

    def test_closure_overrides_historical_state_but_keeps_sources(self):
        self.doc('tmp/demande-test.md', self.demand() + '\nLivraison du périmètre accepté terminée ; limites conservées.\n')
        self.doc('dev-book/demand/DEM-042-test.md', self.demand('à livrer'))
        self.doc('dev-book/tasks/OPS-099-test.md', self.task('validée ; à livrer'))
        demands, tasks, _ = self.scan()
        output = status.render(demands, tasks, 'tasks')
        self.assertNotIn('OPS-099 |', output)
        self.assertIn('exclue', output)
        self.assertIn(str(self.main / 'tmp/demande-test.md'), output)
        # Le filtre explicite rend les archives consultables.
        self.assertIn('OPS-099 |', status.render(demands, tasks, 'tasks', 'DEM-042'))

    def test_suivi_cloture_and_no_false_positive_in_code_or_negative_sentence(self):
        path = self.doc('tmp/test.md', self.demand() + '\nSuivi clôturé : intégration vérifiée.\n')
        self.assertTrue(status.parse_document(path).closed)
        path.write_text(self.demand() + '\nAucune livraison terminée.\n```text\nSuivi clôturé : exemple\n```\n')
        self.assertFalse(status.parse_document(path).closed)

    def test_unknown_missing_source_and_missing_state(self):
        self.doc('tmp/demande-test.md', '# DEM-042 — Une demande\n')
        self.doc('dev-book/tasks/OPS-099-test.md', '# Carte sans identifiant\n')
        self.records.append({'worktree': str(self.root / 'absent')})
        demands, tasks, warnings = self.scan()
        self.assertIn('état absent', status.render(demands, tasks, 'demands'))
        self.assertTrue(any('inaccessible' in w for w in warnings))
        self.assertTrue(any('Identifiant' in w for w in warnings))
        with self.assertRaisesRegex(ValueError, 'inconnue'):
            status.render(demands, tasks, 'tasks', 'DEM-999')

    def test_unreadable_file_and_missing_folder_visible(self):
        path = self.doc('tmp/demande-test.md', self.demand())
        path.write_bytes(b'\xff')
        (self.lane / 'dev-book/demand').rmdir()
        demands, tasks, warnings = self.scan()
        self.assertTrue(any('illisible' in w for w in warnings))
        self.assertTrue(any('Source absente' in w for w in warnings))
        self.assertIn('Aucune demande', status.render(demands, tasks, 'demands'))

    def test_reserved_identifier_without_heading_id(self):
        path = self.doc('tmp/test.md', '# Une demande\n\n- Référence réservée : DEM-042\n\nÉtat : analyse\n')
        parsed = status.parse_document(path)
        self.assertEqual(parsed.identifier, 'DEM-042')
        self.assertEqual(parsed.state, 'analyse')

    def test_filter_and_orphan_task(self):
        self.doc('tmp/test.md', self.demand())
        self.doc('dev-book/demand/DEM-043-test.md', self.demand().replace('DEM-042', 'DEM-043'))
        self.doc('dev-book/tasks/OPS-099-test.md', self.task().replace('DEM-042', 'DEM-999'))
        demands, tasks, _ = self.scan()
        output = status.render(demands, tasks, 'tasks', 'DEM-042')
        self.assertNotIn('DEM-043', output)
        self.assertIn('Aucune carte', output)
        self.assertIn('inconnue pour OPS-099', status.render(demands, tasks, 'tasks'))

    def test_make_real_readonly_commands_and_unknown_demand(self):
        env = {k: v for k, v in os.environ.items() if k not in ('LAYER', 'AIDE_OPERAND', 'MAKEFLAGS', 'MAKELEVEL')}
        for args, expected in [(['demands'], 0), (['tasks', 'DEM-006'], 0),
                               (['tasks', 'DEM-999999'], 2), (['demands', 'DEM-006'], 2),
                               (['tasks', 'help'], 2), (['tasks', 'DEM-%'], 2), (['tasks', 'DEM-005;bad'], 2)]:
            result = subprocess.run(['make', '--no-print-directory', *args], cwd=ROOT,
                                    text=True, capture_output=True, env=env)
            self.assertEqual(result.returncode, expected, result.stderr)
            if args == ['tasks', 'DEM-006']:
                self.assertIn('OPS-014', result.stdout)


if __name__ == '__main__':
    unittest.main()
