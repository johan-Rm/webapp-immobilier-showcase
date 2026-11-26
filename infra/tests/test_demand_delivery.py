"""Contrôles de publication et de clôture dans Git temporaire."""
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from demand_delivery import git, publication, release
from demand_worktree import open_demand


class DemandDelivery(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        git(self.root, 'init', '-b', 'develop')
        git(self.root, 'config', 'user.name', 'Tests')
        git(self.root, 'config', 'user.email', 'tests@example.invalid')
        self.write(self.root, 'dev-book/tasks/OPS-001-historique.md', 'Sans rattachement historique\n')
        self.base = self.save(self.root)
        self.space = open_demand(self.root, 'DEM-101', self.base)
        self.write(self.space, 'dev-book/demand/DEM-101-test.md', '# DEM-101 — Test\n- Type : consolidation\n')

    def write(self, root, name, content):
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)

    def save(self, root):
        git(root, 'add', 'dev-book')
        git(root, 'commit', '-m', 'snapshot')
        return git(root, 'rev-parse', 'HEAD')

    def test_new_orphan_blocks_historical_card_is_accepted(self):
        name = 'dev-book/tasks/OPS-002-test.md'
        self.write(self.space, name, '# Nouvelle carte\n')
        head = self.save(self.space)
        with self.assertRaisesRegex(ValueError, 'rattachement'):
            publication(self.root, 'DEM-101', self.base, head)
        self.write(self.space, name, '- Demande : DEM-101\n')
        publication(self.root, 'DEM-101', self.base, self.save(self.space))

    def test_collision_on_target(self):
        target_name = 'dev-book/demand/DEM-101-autre.md'
        self.write(self.root, target_name, '# DEM-101 — Autre demande\n- Type : consolidation\n')
        target = self.save(self.root)
        head = self.save(self.space)
        with self.assertRaisesRegex(ValueError, 'Collision'):
            publication(self.root, 'DEM-101', target, head)

    def test_squash_required_and_archive_precedes_release(self):
        head = self.save(self.space)
        git(self.root, 'merge', '--squash', head)
        squash = self.save(self.root)
        with self.assertRaisesRegex(ValueError, 'un seul parent'):
            release(self.root, 'DEM-101', squash, self.base)
        git(self.root, 'worktree', 'lock', str(self.space))
        with self.assertRaisesRegex(ValueError, 'verrouillé'):
            release(self.root, 'DEM-101', squash, squash)
        git(self.root, 'worktree', 'unlock', str(self.space))
        archive = release(self.root, 'DEM-101', squash, squash)
        self.assertEqual(git(self.root, 'rev-parse', archive), head)
        self.assertFalse(self.space.exists())
