"""Pilotage isolé : vrais worktrees temporaires, Docker simulé."""
import importlib.util
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'infra/scripts'))
from demand_status import Document

spec = importlib.util.spec_from_file_location('lanes', ROOT / 'infra/scripts/lanes.py')
lanes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lanes)


class Lanes(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='lane espace ')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.git('init', '-q', '-b', 'develop')
        self.git('config', 'user.name', 'Test')
        self.git('config', 'user.email', 'test@example.invalid')
        for relative in ['Makefile', 'infra/make/Makefile.ai-development-engineering',
                         'infra/make/Makefile.dev', 'infra/make/Makefile.preprod',
                         'infra/make/Makefile.prod', 'infra/config/layers.json',
                         'infra/docker/docker-compose.dev.yml',
                         'infra/docker/docker-compose.dashboard-dev.yml',
                         'webapp/.env.example']:
            target = self.root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / relative, target)
        (self.root / '.gitignore').write_text('webapp/.env\n')
        self.git('add', '.')
        self.git('commit', '-qm', 'fixture')
        self.tree = self.root / 'worktree/web'
        self.git('worktree', 'add', '-qb', 'layers/web', str(self.tree))
        with patch.object(lanes, 'ROOT', self.root):
            self.assertEqual(lanes.resolve_lane(self.root, 'web'), self.tree)
        # Validateur réel, données fictives et secrets générés uniquement dans ce dépôt temporaire.
        validator = ROOT / 'codebase-integrity/domaines/construction-livraison/scripts/environment.py'
        subprocess.run(['python3', '-B', str(validator), 'prepare', '--layer', 'web'],
                       cwd=self.tree, check=True, capture_output=True)

    def git(self, *args):
        return subprocess.run(['git', '-C', str(self.root), *args], check=True,
                              capture_output=True, text=True).stdout

    def test_all_actions_route_to_correct_tree_and_validate(self):
        before = (self.tree / 'webapp/.env').read_bytes()
        real_run = subprocess.run
        calls = []
        def execute(argv, **kwargs):
            if argv[0] == 'docker':
                calls.append((argv, kwargs['cwd']))
                return subprocess.CompletedProcess(argv, 0)
            return real_run(argv, **kwargs)
        with patch.object(lanes.subprocess, 'run', side_effect=execute):
            for action in ['up', 'logs', 'rebuild', 'down']:
                self.assertEqual(lanes.run(action, 'web', self.root), 0)
        self.assertTrue(all(cwd == self.tree for _, cwd in calls))
        self.assertIn('--force-recreate', calls[2][0])
        self.assertNotIn('--volumes', calls[3][0])
        self.assertEqual((self.tree / 'webapp/.env').read_bytes(), before)

    def test_dashboard_actions_select_dedicated_composition_and_two_services(self):
        tree = self.root / 'worktree/dashboard'
        self.git('worktree', 'add', '-qb', 'layers/dashboard', str(tree))
        validator = ROOT / 'codebase-integrity/domaines/construction-livraison/scripts/environment.py'
        subprocess.run(['python3', '-B', str(validator), 'prepare', '--layer', 'dashboard'],
                       cwd=tree, check=True, capture_output=True)
        real_run = subprocess.run
        calls = []
        def execute(argv, **kwargs):
            if argv[0] == 'docker':
                calls.append(argv)
                return subprocess.CompletedProcess(argv, 0)
            return real_run(argv, **kwargs)
        with patch.object(lanes.subprocess, 'run', side_effect=execute):
            for action in ('up', 'rebuild', 'logs', 'down'):
                self.assertEqual(lanes.run(action, 'dashboard', self.root), 0)
        for command in calls:
            self.assertEqual(command[command.index('-f') + 1],
                             'infra/docker/docker-compose.dashboard-dev.yml')
        for command in calls[:2]:
            self.assertEqual(command[-2:], ['webapp-localhost', 'nginx'])
        self.assertNotIn('--volumes', calls[-1])
        self.assertEqual(self.make('lane-up', 'dashboard').returncode, 0)

    def test_invalid_runtime_configuration_is_refused(self):
        path = self.tree / 'infra/config/layers.json'
        original = json.loads(path.read_text())
        for change in ({'devComposeFile': '../foreign.yml'},
                       {'devComposeFile': None},
                       {'devComposeFile': 'infra/docker/absent.yml'},
                       {'devServices': []}, {'devServices': ['--build']}):
            config = json.loads(json.dumps(original))
            config['layers']['web'].update(change)
            path.write_text(json.dumps(config))
            with self.subTest(change=change), self.assertRaises(ValueError):
                lanes.run('up', 'web', self.root)

    def test_missing_environment_does_not_start_or_create(self):
        (self.tree / 'webapp/.env').unlink()
        with self.assertRaisesRegex(ValueError, 'lane-env'):
            lanes.run('up', 'web', self.root)
        self.assertFalse((self.tree / 'webapp/.env').exists())

    def test_unknown_layer_and_missing_worktree(self):
        for name, diagnostic in [('wrong', 'inconnue'), ('bff', 'Worktree absent')]:
            with self.assertRaisesRegex(ValueError, diagnostic):
                lanes.resolve_lane(self.root, name)

    def test_wrong_branch_is_refused(self):
        # Simuler une course entre l'inventaire et la vérification effective de la branche.
        real_git = lanes.git
        def changed(tree, *args):
            if args == ('branch', '--show-current'):
                return 'develop'
            return real_git(tree, *args)
        with patch.object(lanes, 'git', side_effect=changed):
            with self.assertRaisesRegex(ValueError, 'Branche différente'):
                lanes.resolve_lane(self.root, 'web')

    def test_symlink_worktree_refused(self):
        with patch.object(lanes, 'context', return_value=(self.root, [
                {'branch': 'refs/heads/layers/web', 'worktree': str(self.root / 'linked')}])):
            (self.root / 'linked').symlink_to(self.tree, target_is_directory=True)
            with self.assertRaisesRegex(ValueError, 'symbolique'):
                lanes.resolve_lane(self.root, 'web')

    def make(self, *args):
        env = {k: v for k, v in os.environ.items() if k not in ('LAYER', 'AIDE_OPERAND', 'MAKEFLAGS', 'MAKELEVEL')}
        return subprocess.run(['make', '--no-print-directory', '-n', *args],
                              cwd=self.root, text=True, capture_output=True, env=env)

    def test_make_positionals_and_legacy_and_no_catchall(self):
        for args in [('lane-up', 'web'), ('lane-down', 'LAYER=web'),
                     ('lane-logs', 'web'), ('lane-rebuild', 'web')]:
            result = self.make(*args)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn('infra/scripts/lanes.py', result.stdout)
        for args in [('lane-up', 'wrong'), ('lane-up', 'web', 'help'),
                     ('lane-up', 'web', 'LAYER=web'), ('lane-up', 'web', 'lane-down'),
                     ('lane-up', 'help'), ('lane-up', '%'), ('unknown-target',)]:
            self.assertNotEqual(self.make(*args).returncode, 0, args)

    def test_layers_are_discovered_from_configuration(self):
        path = self.root / 'infra/config/layers.json'
        config = json.loads(path.read_text())
        config['layers']['preview'] = {'branch': 'layers/preview', 'id': 5}
        path.write_text(json.dumps(config))
        tree = self.root / 'worktree/preview'
        self.git('worktree', 'add', '-qb', 'layers/preview', str(tree))
        with patch.object(lanes, 'ROOT', self.root):
            self.assertEqual(lanes.resolve_lane(self.root, 'preview'), tree)
        self.assertEqual(self.make('lane-up', 'preview').returncode, 0)

    def test_build_and_docker_error_propagation(self):
        real_run = subprocess.run
        def execute(argv, **kwargs):
            if argv[0] == 'docker':
                self.assertIn('--build', argv)
                return subprocess.CompletedProcess(argv, 17)
            return real_run(argv, **kwargs)
        with patch.object(lanes.subprocess, 'run', side_effect=execute):
            self.assertEqual(lanes.run('up', 'web', self.root, build=True), 17)

    def status(self, layer='web', projects=None, error=None, documents=None):
        with patch.object(lanes, 'ROOT', self.root), \
             patch.object(lanes, 'scan', return_value=documents or ({}, {}, [])), \
             patch.object(lanes, 'docker_inventory', return_value=(projects or {}, error)):
            return lanes.status(layer, self.root)

    def project(self):
        config = json.loads((self.root / 'infra/config/layers.json').read_text())
        instance = hashlib.sha256(str(self.root).encode()).hexdigest()[:8]
        return f"{config['project']}-{instance}-web"

    def test_status_without_env_reports_git_and_unknown_availability(self):
        (self.tree / 'webapp/.env').unlink()
        output = self.status()
        self.assertIn('layers/web @', output)
        self.assertIn('indexés 0 ; non indexés 0 ; non suivis 0', output)
        self.assertIn('services absents', output)
        self.assertIn('disponibilité inconnue', output)
        self.assertFalse((self.tree / 'webapp/.env').exists())

    def test_status_staged_modified_untracked_and_no_writes_or_fetch(self):
        path = self.tree / 'Makefile'
        path.write_text(path.read_text() + '\n# index\n')
        subprocess.run(['git', '-C', str(self.tree), 'add', 'Makefile'], check=True)
        path.write_text(path.read_text() + '\n# non indexe\n')
        (self.tree / 'new file.txt').write_text('untracked sentinel')
        before = subprocess.check_output(['git', '-C', str(self.tree), 'status', '--porcelain=v1', '-z'])
        real_run = subprocess.run
        commands = []
        def execute(argv, **kwargs):
            commands.append(argv)
            return real_run(argv, **kwargs)
        with patch.object(lanes.subprocess, 'run', side_effect=execute):
            output = self.status()
        self.assertIn('indexés 1 ; non indexés 1 ; non suivis 1', output)
        self.assertIn('new file.txt', output)
        self.assertFalse(any('fetch' in argv for argv in commands))
        self.assertEqual(before, subprocess.check_output(
            ['git', '-C', str(self.tree), 'status', '--porcelain=v1', '-z']))

    def test_status_stopped_running_and_docker_unavailable(self):
        output = self.status(projects={self.project(): [
            ('dev-server', 'running', 'Up 5 minutes'), ('ssr', 'exited', 'Exited (0)')]})
        self.assertIn('dev-server | running', output)
        self.assertIn('ssr | exited', output)
        output = self.status(error='Docker inaccessible (accès refusé)')
        self.assertIn('Docker inaccessible', output)
        self.assertNotIn('services absents', output)

    def test_status_global_and_selected_and_missing_worktree(self):
        output = self.status(None)
        self.assertIn('web |', output)
        self.assertIn('bff |', output)
        self.assertIn('worktree absent', output)
        self.assertNotIn('bff |', self.status())
        with self.assertRaisesRegex(ValueError, 'inconnue'):
            self.status('wrong')
        for args in [('lane-status',), ('lane-status', 'web'), ('lane-status', 'LAYER=web')]:
            self.assertEqual(self.make(*args).returncode, 0)

    def test_status_discovers_new_layer_and_signals_document_conflicts(self):
        path = self.root / 'infra/config/layers.json'
        config = json.loads(path.read_text())
        config['layers']['preview'] = {'branch': 'layers/preview', 'id': 5}
        path.write_text(json.dumps(config))
        self.assertIn('preview |', self.status(None))
        demand = Document('DEM-042', 'Une demande', '', '', 'en cours', self.root / 'demand.md')
        first = Document('OPS-099', 'Une carte', 'DEM-042', 'web', 'en cours', self.root / 'one.md')
        second = Document('OPS-099', 'Une carte', 'DEM-042', 'web', 'bloquée', self.root / 'two.md')
        output = self.status(documents=({'DEM-042': [demand]}, {'OPS-099': [first, second]}, []))
        self.assertIn('divergents', output)
        self.assertIn('one.md', output)
        self.assertIn('two.md', output)
        closed = Document('DEM-042', 'Une demande', '', '', 'livrée', self.root / 'closed.md', True)
        output = self.status(documents=({'DEM-042': [closed]}, {'OPS-099': [first]}, []))
        self.assertNotIn('OPS-099', output)

    def test_docker_inventory_handles_errors_timeouts_and_malformed_response(self):
        for result, error in [(subprocess.CompletedProcess([], 1, '', 'secret sentinel'), True),
                              (subprocess.CompletedProcess([], 0, 'malformed', ''), True),
                              (subprocess.CompletedProcess([], 0, '', ''), False),
                              (subprocess.CompletedProcess([], 0, 'project\tserver\texited\tExited (0)\n', ''), False)]:
            with patch.object(lanes.subprocess, 'run', return_value=result):
                projects, message = lanes.docker_inventory()
                self.assertEqual(bool(message), error)
                self.assertNotIn('secret sentinel', str(message))
        for exc in [FileNotFoundError(), subprocess.TimeoutExpired('docker', 10)]:
            with patch.object(lanes.subprocess, 'run', side_effect=exc):
                self.assertIn('inaccessible', lanes.docker_inventory()[1])

    def test_git_rename_counts_one_file(self):
        subprocess.run(['git', '-C', str(self.tree), 'mv', 'Makefile', 'Renamed Makefile'], check=True)
        changes = lanes.git_changes(self.tree)
        self.assertEqual(len(changes), 1)
        self.assertEqual(changes[0][1], 'Renamed Makefile')


if __name__ == '__main__':
    unittest.main()
