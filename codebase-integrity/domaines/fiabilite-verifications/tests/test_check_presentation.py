"""La présentation contextualise sans transformer un échec en réussite."""
from contextlib import redirect_stdout
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'commun'))
import check_presentation as presentation


class PresentationTest(unittest.TestCase):
    def test_status_code_context_and_persistent_plain_report(self):
        for status in (0, 7):
            with self.subTest(status=status), tempfile.TemporaryDirectory() as directory:
                output = io.StringIO()
                command = [sys.executable, '-c', f'import sys; print("\\x1b[31mError: exemple\\x1b[0m"); sys.exit({status})']
                with redirect_stdout(output):
                    result = presentation.run('conventions-docs', command, {'GD_TARGET': 'client2-immobilier'}, directory)
                self.assertEqual(result['exit_code'], status)
                self.assertEqual(result['status'], 'ÉCHEC' if status else 'RÉUSSI')
                self.assertIn('[conventions-docs | client2-immobilier]', output.getvalue())
                for title in ('Catégorie', 'Type de contrôle', 'Ce qu’on vérifie', 'Commandes Make', 'Outils', 'Niveau'):
                    self.assertIn(title, output.getvalue())
                log = Path(result['log'])
                self.assertNotIn('\033[', log.read_text())
                self.assertIn('Error: exemple', log.read_text())
                self.assertEqual(json.loads(log.with_name('result.json').read_text())['exit_code'], status)
                self.assertIsNone(result['warning_count'])

    def test_descriptions_cover_every_command(self):
        self.assertEqual(set(presentation.DESCRIPTIONS), set(presentation.META))
        self.assertTrue(all(presentation.DESCRIPTIONS.values()))

    def test_live_is_opt_in_and_keeps_full_report_and_failure(self):
        for flag in (None, '0', '1'):
            with self.subTest(flag=flag), tempfile.TemporaryDirectory() as directory:
                env = {} if flag is None else {'LIVE': flag}
                output = io.StringIO()
                argv = [sys.executable, '-u', '-c',
                        'import sys,time;print("detail-unique",flush=True);time.sleep(.2);print("erreur-unique",file=sys.stderr);sys.exit(7)']
                with redirect_stdout(output):
                    result = presentation.run('third-party-tests-unit', argv, env, directory)
                self.assertEqual(result['exit_code'], 7)
                self.assertIn('DESCRIPTION', output.getvalue())
                self.assertEqual('OUTIL — detail-unique' in output.getvalue(), flag == '1')
                self.assertIn('detail-unique', Path(result['log']).read_text())
                self.assertIn('erreur-unique', Path(result['log']).read_text())

    def test_nested_output_is_not_abbreviated_in_live_mode(self):
        import run_check_output
        with patch.dict(os.environ, {'LIVE': '1', 'CHECK_PRESENTATION_ACTIVE': '1'}), \
             patch.object(run_check_output.subprocess, 'run') as execute:
            execute.return_value.returncode = 7
            self.assertEqual(run_check_output.run('tests-python', ['fake']), 7)
            self.assertNotIn('stdout', execute.call_args.kwargs)
            execute.reset_mock()
            with redirect_stdout(io.StringIO()):
                self.assertEqual(run_check_output.run('conventions', ['fake', '--env-file', '/absent-live-fixture.env']), 2)
            execute.assert_not_called()

    def test_missing_prerequisite_never_launches_process_or_succeeds(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(presentation.subprocess, 'Popen') as launch, redirect_stdout(io.StringIO()):
            result = presentation.run('third-party-tests-browser', ['unused'], {}, directory)
        launch.assert_not_called()
        self.assertEqual(result['status'], 'NON EXÉCUTÉ')
        self.assertEqual(result['exit_code'], 2)

    def test_all_missing_prerequisites_are_explicit(self):
        for name in ('third-party-tests-load', 'third-party-tests-lighthouse', 'third-party-tests-components', 'conventions-devbook'):
            with self.subTest(command=name):
                self.assertTrue(presentation.precondition(name, {}))
        self.assertIsNone(presentation.precondition('third-party-tests-components', {'GD_TARGET': 'dashboard'}))

    def test_unavailable_executable_is_not_a_test_failure(self):
        with tempfile.TemporaryDirectory() as directory, redirect_stdout(io.StringIO()):
            result = presentation.run('conventions-docs', ['/does-not-exist-presentation'], {}, directory)
        self.assertEqual(result['status'], 'NON EXÉCUTÉ')
        self.assertEqual(result['exit_code'], 2)

    def test_color_respects_no_color_and_non_terminal(self):
        with tempfile.TemporaryDirectory() as directory, redirect_stdout(io.StringIO()) as output:
            presentation.run('third-party-tests-browser', ['unused'], {'NO_COLOR': ''}, directory)
        self.assertNotIn('\033[', output.getvalue())

    def test_logs_remain_complete_when_screen_is_short(self):
        with tempfile.TemporaryDirectory() as directory, redirect_stdout(io.StringIO()) as output:
            result = presentation.run('conventions-docs', [sys.executable, '-c', 'print("verbose\\n" * 1000)'], {}, directory)
            self.assertEqual(Path(result['log']).read_text().count('verbose'), 1000)
        self.assertLess(output.getvalue().count('verbose'), 10)

    def test_grouped_run_continues_and_keeps_distinct_profiles(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'webapp/.tmp/quality/console').mkdir(parents=True)
            calls = []
            def execute(name, argv, env):
                calls.append((name, env.get('PROFILE', '')))
                return {'command': name, 'profile': env.get('PROFILE', ''), 'exit_code': 1 if len(calls) == 1 else 0, 'status': 'ÉCHEC' if len(calls) == 1 else 'RÉUSSI'}
            with patch.object(presentation, 'ROOT', root), patch.object(presentation, 'run', side_effect=execute), patch.dict(os.environ, {}, clear=True), patch.object(sys, 'argv', ['presentation', 'checks-run']), redirect_stdout(io.StringIO()) as output:
                code = presentation.main()
            self.assertEqual(code, 1)
            self.assertIn(('verifiers-test', ''), calls)
            self.assertIn(('third-party-tests-lighthouse', 'desktop'), calls)
            self.assertIn(('third-party-tests-lighthouse', 'mobile'), calls)
            self.assertFalse(any(name in ('checks-rebuild', 'third-party-tests-code') for name, _ in calls))
            self.assertEqual(len(list((root / 'webapp/.tmp/quality/console').glob('summary-*.json'))), 1)
            self.assertIn('ÉCHEC : 1', output.getvalue())

    def test_interruption_stops_only_the_owned_group(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(presentation.subprocess, 'Popen') as launch, patch.object(presentation.os, 'killpg') as stop, redirect_stdout(io.StringIO()):
            launch.return_value.pid = 12345
            launch.return_value.wait.side_effect = [KeyboardInterrupt, 0]
            result = presentation.run('conventions-docs', ['fake'], {}, directory)
        stop.assert_called_once_with(12345, presentation.signal.SIGTERM)
        self.assertEqual(result['exit_code'], 130)
        self.assertEqual(result['status'], 'INTERROMPU')


if __name__ == '__main__':
    unittest.main()
