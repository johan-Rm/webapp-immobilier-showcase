"""La présentation commune conserve le résultat du contrôle et tous ses diagnostics."""
import importlib.util
import io
from pathlib import Path
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from unittest.mock import patch

COMMON = Path(__file__).resolve().parents[3] / 'commun'
sys.path.insert(0, str(COMMON))
spec = importlib.util.spec_from_file_location('check_output', COMMON / 'run_check_output.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class CheckOutputTest(unittest.TestCase):
    def test_success_failure_and_full_plain_log(self):
        for status in (0, 1, 7):
            with self.subTest(status=status), tempfile.TemporaryDirectory() as directory:
                output = io.StringIO()
                name = str(Path(directory) / 'result.log')
                import os
                descriptor = os.open(name, os.O_CREAT | os.O_WRONLY)
                with patch.object(runner.tempfile, 'mkstemp', return_value=(descriptor, name)), patch.object(runner, 'supports_color', return_value=True), redirect_stdout(output):
                    code = runner.run('devbook', [sys.executable, '-c', f'import sys;print("diagnostic\\n"*20);sys.exit({status})'])
                self.assertEqual(code, status)
                self.assertIn('\033[34mINFO', output.getvalue())
                self.assertIn('ÉCHEC' if status else 'RÉUSSI', output.getvalue())
                self.assertNotIn('\033[', Path(name).read_text())
                self.assertEqual(Path(name).read_text().count('diagnostic'), 20)
                self.assertLess(output.getvalue().count('diagnostic'), 20)

    def test_missing_environment_does_not_launch_docker(self):
        output = io.StringIO()
        with tempfile.TemporaryDirectory() as directory, patch.object(runner.subprocess, 'run') as launch, redirect_stdout(output):
            status = runner.run('conventions', ['docker', 'compose', '--env-file', str(Path(directory) / 'absent.env'), 'run'])
        self.assertEqual(status, 2)
        launch.assert_not_called()
        self.assertIn('NON EXÉCUTÉ', output.getvalue())
        self.assertIn('Aucun vérificateur lancé', output.getvalue())

    def test_small_diagnostic_set_is_complete(self):
        output = io.StringIO()
        with redirect_stdout(output):
            status = runner.run('devbook', [sys.executable, '-c', 'import sys;print("premier écart\\nsecond écart");sys.exit(1)'])
        self.assertEqual(status, 1)
        self.assertIn('premier écart', output.getvalue())
        self.assertIn('second écart', output.getvalue())
        self.assertNotIn('NON EXÉCUTÉ', output.getvalue())

    def test_warning_summary_is_visible_without_changing_status(self):
        output = io.StringIO()
        with redirect_stdout(output):
            status = runner.run('guards', [sys.executable, '-c', 'print("⚠  47 gardes suspectes\\n" + "détail\\n" * 30)'])
        self.assertEqual(status, 0)
        self.assertIn('47 gardes suspectes', output.getvalue())
        self.assertIn('Aucun écart bloquant', output.getvalue())
        self.assertIn('contrat de type', output.getvalue())
        self.assertIn('Sortie abrégée', output.getvalue())

    def test_python_totals_replace_expected_negative_fixture_output(self):
        output = io.StringIO()
        script = 'print("Contribution refusée simulée\\n" * 15 + "Ran 152 tests in 1.0s\\nOK")'
        with redirect_stdout(output):
            status = runner.run('tests-python', [sys.executable, '-c', script])
        self.assertEqual(status, 0)
        self.assertIn('Ran 152 tests', output.getvalue())
        self.assertNotIn('Contribution refusée simulée', output.getvalue())

    def test_absent_executable_is_failure(self):
        with redirect_stdout(io.StringIO()):
            self.assertEqual(runner.run('conventions', ['/nonexistent/check-tool']), 2)


if __name__ == '__main__':
    unittest.main()
