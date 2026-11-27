"""Contrôles de publication et de clôture dans Git temporaire."""
from pathlib import Path
import json
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from demand_delivery import clean_environment, git, publication, release
from demand_worktree import open_demand


class DemandDelivery(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name) / 'repo'
        self.root.mkdir()
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

    def test_release_legacy_internal_worktree(self):
        legacy = self.root / 'worktree/DEM-101'
        legacy.parent.mkdir()
        git(self.root, 'worktree', 'move', str(self.space), str(legacy))
        self.space = legacy
        head = self.save(self.space)
        git(self.root, 'merge', '--squash', head)
        squash = self.save(self.root)
        release(self.root, 'DEM-101', squash, squash)
        self.assertFalse(legacy.exists())

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

    def test_only_request_env_is_removed(self):
        other = open_demand(self.root, 'DEM-103', self.base, 'other')
        self.write(other, 'webapp/.env', 'other secret')
        self.write(self.root, '.gitignore', '.env\n')
        self.write(self.root, 'dev-book/tasks/OPS-001-historique.md', 'Sans rattachement historique\n')
        git(self.root, 'add', '.gitignore')
        git(self.root, 'commit', '-m', 'ignore env')
        # L'exclusion commune reproduit la règle déjà présente dans le dépôt réel.
        (self.root / '.git/info/exclude').write_text('.env\n')
        self.write(self.space, 'webapp/.env', 'request secret')
        self.write(self.root, 'webapp/.env', 'principal secret')
        head = self.save(self.space)
        git(self.root, 'merge', '--squash', head)
        squash = self.save(self.root)
        release(self.root, 'DEM-101', squash, squash)
        self.assertEqual((self.root / 'webapp/.env').read_text(), 'principal secret')
        self.assertEqual((other / 'webapp/.env').read_text(), 'other secret')
        self.assertFalse(self.space.exists())

    def test_other_ignored_data_blocks_and_preserves_env(self):
        (self.root / '.git/info/exclude').write_text('.env\ndata-cache\n')
        self.write(self.space, 'webapp/.env', 'request secret')
        self.write(self.space, 'data-cache', 'unknown user data')
        head = self.save(self.space)
        git(self.root, 'merge', '--squash', head)
        squash = self.save(self.root)
        with self.assertRaisesRegex(ValueError, 'fichiers locaux'):
            release(self.root, 'DEM-101', squash, squash)
        self.assertEqual((self.space / 'webapp/.env').read_text(), 'request secret')
        self.assertEqual((self.space / 'data-cache').read_text(), 'unknown user data')

    def test_symlink_env_is_never_removed(self):
        (self.root / '.git/info/exclude').write_text('.env\n')
        self.write(self.root, 'other-secret', 'preserve')
        (self.space / 'webapp').mkdir()
        (self.space / 'webapp/.env').symlink_to(self.root / 'other-secret')
        head = self.save(self.space)
        git(self.root, 'merge', '--squash', head)
        squash = self.save(self.root)
        with self.assertRaisesRegex(ValueError, 'ambigu'):
            release(self.root, 'DEM-101', squash, squash)
        self.assertEqual((self.root / 'other-secret').read_text(), 'preserve')
        self.assertTrue((self.space / 'webapp/.env').is_symlink())

    def test_registered_environment_blocks_release(self):
        head = self.save(self.space)
        git(self.root, 'merge', '--squash', head)
        squash = self.save(self.root)
        registry = self.root / '.git/aide-demand-environments.json'
        registry.write_text(json.dumps({'DEM-101': {'worktree': str(self.space)}}))
        with self.assertRaisesRegex(ValueError, 'ambigu'):
            release(self.root, 'DEM-101', squash, squash)
        self.assertTrue(self.space.exists())
        self.assertEqual(git(self.space, 'rev-parse', 'HEAD'), head)

    def test_registered_empty_environment_is_cleaned(self):
        head = self.save(self.space)
        git(self.root, 'merge', '--squash', head)
        squash = self.save(self.root)
        registry = self.root / '.git/aide-demand-environments.json'
        registry.write_text(json.dumps({'DEM-101': {'worktree': str(self.space),
                           'host_suffix': 'dem-101.localhost', 'ports': [22000, 22001, 22002, 22003, 22004]}}))
        with patch('demand_delivery.docker', return_value=''):
            archive = release(self.root, 'DEM-101', squash, squash)
        self.assertEqual(git(self.root, 'rev-parse', archive), head)
        self.assertEqual(json.loads(registry.read_text()), {})
        self.assertFalse(self.space.exists())

    def test_foreign_container_is_never_removed(self):
        def response(*args):
            if args[:2] == ('ps', '-aq'):
                return 'foreign'
            if args[:2] == ('inspect', 'foreign'):
                return json.dumps([{'Id': 'foreign', 'Config': {'Labels': {
                    'com.docker.compose.project': 'foreign',
                    'com.docker.compose.project.working_dir': '/another'}}}])
            return ''
        with patch('demand_delivery.docker', side_effect=response) as mocked:
            with self.assertRaisesRegex(ValueError, 'étranger'):
                clean_environment(self.root, 'DEM-101', self.space)
        self.assertFalse(any(call.args[0] in ('stop', 'rm') for call in mocked.call_args_list))

    def test_named_volume_and_foreign_network_block_cleanup(self):
        def response(*args):
            if args[:3] == ('volume', 'ls', '-q'):
                return 'unknown-volume'
            return ''
        with patch('demand_delivery.docker', side_effect=response) as mocked:
            with self.assertRaisesRegex(ValueError, 'Volume'):
                clean_environment(self.root, 'DEM-101', self.space)
        self.assertFalse(any(call.args[0] in ('stop', 'rm') for call in mocked.call_args_list))

    def test_owned_resources_are_removed_after_complete_inventory(self):
        calls = []
        def response(*args):
            calls.append(args)
            if args[:2] == ('ps', '-aq') and args[-1].endswith('-site'):
                return 'owned'
            if args[:2] == ('inspect', 'owned'):
                project = calls[0][-1].rsplit('=', 1)[1]
                return json.dumps([{'Id': 'owned', 'Config': {'Labels': {
                    'com.docker.compose.project': project,
                    'com.docker.compose.project.working_dir': str(self.space)}},
                    'HostConfig': {'AutoRemove': False}, 'State': {'Running': True}}])
            return ''
        with patch('demand_delivery.docker', side_effect=response):
            clean_environment(self.root, 'DEM-101', self.space)
        self.assertIn(('stop', '--time', '15', 'owned'), calls)
        self.assertIn(('rm', 'owned'), calls)
        self.assertGreater(calls.index(('stop', '--time', '15', 'owned')), 6)

    def test_descriptive_branch_release_and_foreign_files_block(self):
        space = open_demand(self.root, 'DEM-102', self.base, 'feature')
        self.write(space, 'dev-book/demand/DEM-102-test.md', '# DEM-102 — Test\n- Type : consolidation\n')
        head = self.save(space)
        git(self.root, 'merge', '--squash', head)
        squash = self.save(self.root)
        self.write(space, 'unexpected.txt', 'do not delete')
        with self.assertRaisesRegex(ValueError, 'contenant des fichiers'):
            release(self.root, 'DEM-102', squash, squash)
        self.assertTrue((space / 'unexpected.txt').exists())
        (space / 'unexpected.txt').unlink()
        archive = release(self.root, 'DEM-102', squash, squash)
        self.assertEqual(git(self.root, 'rev-parse', archive), head)
        with self.assertRaises(ValueError):
            git(self.root, 'rev-parse', '--verify', 'refs/heads/demands/DEM-102-feature')

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
        with self.assertRaises(ValueError):
            git(self.root, 'rev-parse', '--verify', 'refs/heads/demands/DEM-101')
