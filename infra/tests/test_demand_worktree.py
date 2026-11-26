"""Espaces de demande dans un dépôt temporaire."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from demand_worktree import git, open_demand


class DemandWorktree(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
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
        (self.root / 'worktree/DEM-102').mkdir(parents=True)
        with self.assertRaisesRegex(ValueError, 'occupée'):
            open_demand(self.root, 'DEM-102', 'develop')

    def test_concurrent_same_identity(self):
        def attempt():
            try:
                return open_demand(self.root, 'DEM-101', 'develop')
            except ValueError:
                return None

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: attempt(), range(2)))
        self.assertIn(self.root / 'worktree/DEM-101', results)
        self.assertEqual(git(self.root, 'worktree', 'list', '--porcelain').count(
            'branch refs/heads/demands/DEM-101'), 1)
