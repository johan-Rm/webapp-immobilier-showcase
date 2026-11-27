"""Espaces de demande dans un dépôt temporaire."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import sys
import subprocess
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from demand_worktree import git, open_demand


class DemandWorktree(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name) / 'repo'
        self.root.mkdir()
        self.parent = self.root.parent / (self.root.name + '.worktrees')
        git(self.root, 'init', '-b', 'develop')
        git(self.root, '-c', 'user.name=Tests', '-c', 'user.email=tests@example.invalid',
            'commit', '--allow-empty', '-m', 'base')

    def test_parallel_demands_and_reopen(self):
        first = open_demand(self.root, 'DEM-101', 'develop')
        second = open_demand(self.root, 'DEM-102', 'develop')
        self.assertNotEqual(first, second)
        self.assertEqual(open_demand(second, 'DEM-101', 'develop'), first)
        self.assertEqual(git(self.root, 'branch', '--show-current'), 'develop')

    def test_collision_and_occupied_path(self):
        git(self.root, 'branch', 'demands/DEM-101')
        with self.assertRaisesRegex(ValueError, 'déjà attribué'):
            open_demand(self.root, 'DEM-101', 'develop')
        (self.parent / 'DEM-102').mkdir(parents=True)
        with self.assertRaisesRegex(ValueError, 'occupée'):
            open_demand(self.root, 'DEM-102', 'develop')

    def test_reopen_legacy_and_reject_foreign_parent(self):
        old = self.root / 'worktree/DEM-110-sujet'
        old.parent.mkdir()
        git(self.root, 'worktree', 'add', '-b', 'demands/DEM-110-sujet', str(old), 'develop')
        self.assertEqual(open_demand(self.root, 'DEM-110', 'develop', 'sujet'), old)
        foreign = self.root.parent / 'foreign/DEM-111-sujet'
        foreign.parent.mkdir()
        git(self.root, 'worktree', 'add', '-b', 'demands/DEM-111-sujet', str(foreign), 'develop')
        with self.assertRaisesRegex(ValueError, 'non réutilisable'):
            open_demand(self.root, 'DEM-111', 'develop', 'sujet')

    def test_refuses_symbolic_parent(self):
        target = self.root.parent / 'other'
        target.mkdir()
        self.parent.symlink_to(target, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'symbolique'):
            open_demand(self.root, 'DEM-112', 'develop', 'sujet')

    def test_reserved_draft_can_be_materialized(self):
        draft = self.root / 'tmp/demande.md'
        draft.parent.mkdir()
        draft.write_text('# DEM-105 — Proposition\n')
        self.assertEqual(open_demand(self.root, 'DEM-105', 'develop', 'sujet').name,
                         'DEM-105-sujet')

    def test_cli_reopens_legacy_but_does_not_create_legacy(self):
        tree = open_demand(self.root, 'DEM-107', 'develop')
        script = Path(__file__).resolve().parents[1] / 'scripts/demand_worktree.py'
        reopened = subprocess.run([sys.executable, str(script), 'DEM-107', '--base', 'develop'],
                                  cwd=self.root, capture_output=True, text=True)
        self.assertEqual(reopened.returncode, 0, reopened.stderr)
        self.assertEqual(reopened.stdout.strip(), str(tree))
        new = subprocess.run([sys.executable, str(script), 'DEM-108', '--base', 'develop'],
                             cwd=self.root, capture_output=True, text=True)
        self.assertNotEqual(new.returncode, 0)
        self.assertIn('Sujet descriptif requis', new.stderr)

    def test_descriptive_identity_and_collision(self):
        tree = open_demand(self.root, 'DEM-103', 'develop', 'mon-sujet')
        self.assertEqual(tree.name, 'DEM-103-mon-sujet')
        self.assertEqual(git(tree, 'branch', '--show-current'), 'demands/DEM-103-mon-sujet')
        self.assertEqual(open_demand(self.root, 'DEM-103', 'develop', 'mon-sujet'), tree)
        with self.assertRaisesRegex(ValueError, 'déjà attribué'):
            open_demand(self.root, 'DEM-103', 'develop', 'autre-sujet')
        with self.assertRaisesRegex(ValueError, 'invalide'):
            open_demand(self.root, 'DEM-104', 'develop', '../unsafe')

    def test_concurrent_different_subjects_same_identity(self):
        def attempt(subject):
            try:
                return open_demand(self.root, 'DEM-106', 'develop', subject)
            except ValueError:
                return None

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(attempt, ('premier', 'second')))
        self.assertEqual(sum(result is not None for result in results), 1)
        self.assertEqual(git(self.root, 'worktree', 'list', '--porcelain').count(
            'branch refs/heads/demands/DEM-106-'), 1)

    def test_concurrent_same_identity(self):
        def attempt():
            try:
                return open_demand(self.root, 'DEM-101', 'develop')
            except ValueError:
                return None

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: attempt(), range(2)))
        self.assertIn(self.parent / 'DEM-101', results)
        self.assertEqual(git(self.root, 'worktree', 'list', '--porcelain').count(
            'branch refs/heads/demands/DEM-101'), 1)
