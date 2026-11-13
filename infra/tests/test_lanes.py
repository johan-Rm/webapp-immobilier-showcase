"""Pilotage isolé : vrais worktrees temporaires, Docker simulé."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
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


if __name__ == '__main__':
    unittest.main()
