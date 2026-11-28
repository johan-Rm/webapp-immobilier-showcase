"""La présentation conserve les échecs et poursuit toutes les étapes."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from contextlib import redirect_stdout
from types import SimpleNamespace
import io

path = Path(__file__).resolve().parents[3] / 'commun/run_aide_checks.py'
spec = importlib.util.spec_from_file_location('aide_runner', path)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class AideRunnerTest(unittest.TestCase):
    def execute(self, codes, colored=False):
        # Simuler les codes des quatre contrôles et vérifier leur ordre d'appel.
        with tempfile.TemporaryDirectory() as directory:
            output = io.StringIO()
            def run(*args, **kwargs):
                kwargs['stdout'].write('Contrôle effectué\n')
                return SimpleNamespace(returncode=next(codes))
            with patch.object(runner.tempfile, 'mkdtemp', return_value=directory), patch.object(runner.subprocess, 'run', side_effect=run) as mock, patch.object(runner, 'supports_color', return_value=colored), redirect_stdout(output):
                code = runner.main()
            self.assertEqual(mock.call_count, 4)
            self.assertEqual([Path(call.args[0][-1]).name for call in mock.call_args_list], ['check_registry.py', 'check_demands.py', 'check_docs.py', 'check_runtime_names.py'])
            self.assertEqual(len(list(Path(directory).glob('*.log'))), 4)
            if not colored:
                self.assertNotIn('\033[', output.getvalue())
            for log in Path(directory).glob('*.log'):
                self.assertNotIn('\033[', log.read_text())
            return code, output.getvalue()

    def test_color_requires_compatible_terminal_and_respects_no_color(self):
        """La couleur exige un terminal compatible et respecte NO_COLOR."""
        terminal = SimpleNamespace(isatty=lambda: True)
        pipe = SimpleNamespace(isatty=lambda: False)
        self.assertTrue(runner.supports_color(terminal, {'TERM': 'xterm-256color'}))
        for stream, env in ((pipe, {'TERM': 'xterm'}), (terminal, {'TERM': 'dumb'}), (terminal, {}), (terminal, {'TERM': 'xterm', 'NO_COLOR': ''})):
            with self.subTest(env=env):
                self.assertFalse(runner.supports_color(stream, env))

    def test_color_keeps_labels_and_resets_each_span(self):
        """La coloration conserve le libellé et réinitialise chaque séquence."""
        self.assertEqual(runner.paint('ÉCHEC', 'red', True), '\033[31mÉCHEC\033[0m')
        self.assertEqual(runner.paint('ÉCHEC', 'red', False), 'ÉCHEC')

    def test_colored_run_keeps_diagnostics_and_reports_plain(self):
        """Les diagnostics colorés restent lisibles et les rapports sans couleur."""
        code, output = self.execute(iter([0, 0, 1, 0]), colored=True)
        self.assertEqual(code, 1)
        self.assertIn('\033[34m[1/4] EN COURS', output)
        self.assertIn('\033[32mRÉUSSI', output)
        self.assertIn('\033[31mÉCHEC', output)
        self.assertIn('\033[90m', output)
        for line in output.splitlines():
            if 'Détails :' in line or 'Rapport complet :' in line:
                self.assertNotIn('\033[', line)

    def test_success_is_explained(self):
        """Le bilan explique la réussite des quatre contrôles."""
        code, output = self.execute(iter([0, 0, 0, 0]))
        self.assertEqual(code, 0)
        self.assertIn('4/4 étapes réussies', output)
        self.assertIn('make internal-tests-verifiers', output)
        self.assertNotIn('tests réussis', output)

    def test_failure_is_not_hidden_and_all_steps_run(self):
        """Les échecs restent visibles et tous les contrôles sont exécutés."""
        code, output = self.execute(iter([1, 0, 1, 0]))
        self.assertEqual(code, 1)
        self.assertIn('2/4 étapes réussies', output)
        self.assertIn('À corriger', output)


if __name__ == '__main__':
    unittest.main()
