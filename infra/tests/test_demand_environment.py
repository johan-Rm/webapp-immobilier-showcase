"""Allocation locale indépendante de Docker."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import sys
import socket
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from demand_environment import available, prepare, reserve, run
from demand_worktree import git, open_demand


class DemandEnvironment(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        git(self.root, 'init', '-b', 'develop')
        git(self.root, '-c', 'user.name=Tests', '-c', 'user.email=tests@example.invalid',
            'commit', '--allow-empty', '-m', 'base')
        self.first = open_demand(self.root, 'DEM-101', 'develop', 'one')
        self.second = open_demand(self.root, 'DEM-102', 'develop', 'two')

    def test_stable_and_separate_concurrent_allocations(self):
        with patch('demand_environment.available', return_value=True):
            with ThreadPoolExecutor(max_workers=2) as pool:
                first, second = list(pool.map(reserve, (self.first, self.second)))
        self.assertEqual(first, reserve(self.first))
        self.assertEqual(second, reserve(self.second))
        self.assertTrue(set(first['ports']).isdisjoint(second['ports']))
        self.assertNotEqual(first['host_suffix'], second['host_suffix'])

    def test_refuses_corrupt_registry_and_foreign_tree(self):
        (self.root / '.git/aide-demand-environments.json').write_text('[]')
        with self.assertRaisesRegex(ValueError, 'invalide'):
            reserve(self.first)
        with self.assertRaisesRegex(ValueError, 'requise|requis'):
            reserve(self.root)

    def test_prepare_preserves_existing_file(self):
        webapp = self.first / 'webapp'
        webapp.mkdir()
        (webapp / '.env.example').write_text('COMPOSE_PROJECT_NAME=default\nNUXT_SESSION_PASSWORD=\n')
        with patch('demand_environment.available', return_value=True):
            env = prepare(self.first)
        first = env.read_text()
        self.assertIn('COMPOSE_PROJECT_NAME=showcase-dem-101', first)
        self.assertEqual(first, prepare(self.first).read_text())
        self.assertEqual(env.stat().st_mode & 0o777, 0o600)

    def test_commands_target_distinct_compose_projects(self):
        webapp = self.first / 'webapp'
        webapp.mkdir()
        (webapp / '.env.example').write_text('COMPOSE_PROJECT_NAME=default\n')
        with patch('demand_environment.available', return_value=True):
            with patch('demand_environment.compose_run', return_value=0) as execute:
                self.assertEqual(run(self.first, 'up', 'site'), 0)
                self.assertEqual(run(self.first, 'up', 'dashboard'), 0)
        first, second = execute.call_args_list
        self.assertTrue(any(value.endswith('-dem-101-site') for value in first.args[0]))
        self.assertTrue(any(value.endswith('-dem-101-dashboard') for value in second.args[0]))
        self.assertNotEqual(first.args[2]['PUBLIC_PORT'], second.args[2]['PUBLIC_PORT'])
        self.assertNotEqual(first.args[2]['DASHBOARD_HOST'], second.args[2]['DASHBOARD_HOST'])

    def test_fixture_mode_uses_reserved_port_and_separate_name(self):
        with patch('demand_environment.available', return_value=True):
            with patch('demand_environment.compose_run', return_value=0) as execute:
                self.assertEqual(run(self.first, 'test-up', 'site'), 0)
                self.assertEqual(run(self.second, 'test-up', 'dashboard'), 0)
        first, second = execute.call_args_list
        self.assertIn('GD_TARGET=showcase-immobilier', first.args[0])
        self.assertIn('GD_TARGET=dashboard', second.args[0])
        self.assertNotEqual(first.args[0][-1], second.args[0][-1])
        self.assertNotEqual(first.args[0][-2], second.args[0][-2])
        self.assertFalse((self.first / 'webapp/.env').exists())

    def test_occupied_local_port_is_not_available(self):
        with socket.socket() as listener:
            listener.bind(('127.0.0.1', 0))
            self.assertFalse(available([listener.getsockname()[1]]))

    def test_busy_ports_are_skipped(self):
        with patch('demand_environment.available', side_effect=[False, True]):
            self.assertEqual(reserve(self.first)['ports'][0], 22005)


if __name__ == '__main__':
    unittest.main()
