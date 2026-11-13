"""Conformités et échecs du contrôle de commits dans des dépôts jetables."""
from pathlib import Path as _Path
import sys as _sys
_common = _Path(__file__).resolve().parent
if not (_common / 'bootstrap.py').is_file():
    _common = next((p / 'codebase-integrity/commun' for p in _Path(__file__).resolve().parents if (p / 'codebase-integrity/commun').is_dir()), _common)
_sys.path.insert(0, str(_common))
from bootstrap import REPO_ROOT, configure_imports
configure_imports()

import importlib.util
import io
from pathlib import Path
import subprocess
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('check_commits', Path(__file__).parents[1] / 'scripts/check_commits.py')
commits = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(commits)
MESSAGE = 'feat(OPS-075): contrôler les messages\n\nDemande : DEM-024\n'


class MessagesTest(unittest.TestCase):
    def test_types_and_optional_explanation(self):
        for kind in commits.TYPES.split('|'):
            self.assertEqual(commits.message_fields(MESSAGE.replace('feat(', kind + '(')), ('OPS-075', 'DEM-024'))
        self.assertEqual(commits.message_fields(MESSAGE + '\n(cherry picked from commit ' + 'a' * 40 + ')'), ('OPS-075', 'DEM-024'))
        self.assertEqual(commits.message_fields('docs(DEM-024): consigner les contrôles'), ('DEM-024', 'DEM-024'))
        self.assertEqual(commits.message_fields(MESSAGE.replace('075', '1075')), ('OPS-1075', 'DEM-024'))

    def test_dashboard_scope_and_unknown_prefix(self):
        self.assertEqual(commits.message_fields(MESSAGE.replace('OPS-075', 'DASH-001')),
                         ('DASH-001', 'DEM-024'))
        for scope in ('DASH-01', 'DASHBOARD-001', 'UNKNOWN-001'):
            with self.subTest(scope=scope), self.assertRaises(ValueError):
                commits.message_fields(MESSAGE.replace('OPS-075', scope))

    def test_invalid_titles_and_references(self):
        for message in (
            '', 'wip', MESSAGE.replace('feat(', 'merge('), MESSAGE.replace('OPS-075', 'devops'),
            MESSAGE.replace('075', '75'), MESSAGE.replace('messages\n', 'messages.\n'),
            MESSAGE.replace('contrôler les messages', 'WIP provisoire'),
            MESSAGE.replace('contrôler les messages', 'fixup! provisoire'),
            MESSAGE.replace('contrôler les messages', 'corrections diverses'),
            'feat(OPS-075): ', MESSAGE.replace('\n\n', '\n'),
            MESSAGE.split('\n\n')[0], MESSAGE + 'Demande : DEM-025\n',
            MESSAGE.replace('Demande :', 'Demande:'), MESSAGE.replace('feat(OPS-075)', 'feat(DEM-024)'),
            'docs(DEM-024): tracer\n\nDemande : DEM-025',
        ):
            with self.subTest(message=message), self.assertRaises(ValueError):
                commits.message_fields(message)


class RangeTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'repo'
        self.root.mkdir()
        self.git('init', '-q')
        self.git('config', 'user.name', 'Fixture')
        self.git('config', 'user.email', 'fixture@example.invalid')
        self.git('config', 'commit.gpgsign', 'false')
        self.write('base.txt', 'base')
        self.base = self.commit('historique conservé')
        self.write('dev-book/demand/DEM-024-exemple.md', '# Demande\n- Type : consolidation\n')
        self.write('dev-book/tasks/OPS-075-exemple.md', '# Carte\n\n- Demande : [DEM-024](../demand/DEM-024-exemple.md).\n\n## Mission\n')
        self.head = self.commit(MESSAGE)

    def git(self, *args):
        return commits.git(self.root, *args).strip()

    def write(self, name, content):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding='utf-8')

    def commit(self, message):
        self.git('add', '.')
        self.git('commit', '-q', '--allow-empty', '-m', message)
        return self.git('rev-parse', 'HEAD')

    def check(self, head='HEAD'):
        return commits.check_range(self.root, self.base, head)

    def test_complete_series_and_empty_range(self):
        self.assertEqual(self.check(), ([], 1))
        self.commit('docs(OPS-075): consigner le SHA validé\n\nDemande : DEM-024')
        self.assertEqual(self.check(), ([], 2))
        self.assertEqual(self.check(self.base), ([], 0))

    def test_invalid_middle_commit_is_not_hidden_by_valid_head(self):
        bad = self.commit('corrections diverses')
        self.commit(MESSAGE)
        errors, count = self.check()
        self.assertEqual(count, 3)
        self.assertEqual(len(errors), 1)
        self.assertIn(bad, errors[0])

    def test_references_use_requested_head_not_dirty_worktree(self):
        self.write('dev-book/tasks/OPS-075-exemple.md', 'contenu étranger non commité')
        self.assertEqual(self.check(), ([], 1))

    def test_missing_and_duplicate_documents(self):
        self.git('rm', 'dev-book/demand/DEM-024-exemple.md')
        self.commit(MESSAGE)
        self.assertTrue(self.check()[0])
        self.write('dev-book/demand/DEM-024-exemple.md', '# Demande')
        self.write('dev-book/demand/DEM-024-doublon.md', '# Doublon')
        self.commit(MESSAGE)
        self.assertTrue(self.check()[0])

    def test_dashboard_card_reference_is_required(self):
        message = MESSAGE.replace('OPS-075', 'DASH-001')
        self.commit(message)
        self.assertTrue(self.check()[0])
        self.write('dev-book/tasks/DASH-001-exemple.md', '# Carte\n- Demande : DEM-024\n')
        self.commit(message)
        self.assertEqual(self.check()[0], [])

    def test_missing_card_and_conflicting_parent(self):
        self.assertRaises(ValueError, commits.references, self.root, self.head,
                          ['dev-book/demand/DEM-024-exemple.md'], 'BFF-003', 'DEM-024')
        self.write('dev-book/tasks/OPS-075-exemple.md', '# Carte\n- Demande : DEM-025\n')
        self.commit(MESSAGE)
        self.assertTrue(self.check()[0])

    def test_document_symlink_is_rejected(self):
        path = self.root / 'dev-book/demand/DEM-024-exemple.md'
        path.unlink()
        path.symlink_to('../../base.txt')
        self.commit(MESSAGE)
        self.assertTrue(self.check()[0])

    def test_demand_scope_documentary_paths_only(self):
        self.write('dev-book/demand/DEM-024-exemple.md', '# Demande\nComplément')
        self.commit('docs(DEM-024): consigner les contrôles')
        self.assertEqual(self.check()[0], [])
        self.write('code.py', 'print(1)')
        self.commit('docs(DEM-024): consigner les contrôles')
        self.assertIn('hors traces', self.check()[0][0])

    def test_deleted_non_documentary_path_is_rejected(self):
        self.git('rm', 'base.txt')
        self.commit('docs(DEM-024): consigner les contrôles')
        self.assertTrue(self.check()[0])

    def test_new_merge_is_rejected(self):
        self.git('branch', 'side')
        self.write('a.txt', 'a')
        self.commit(MESSAGE)
        self.git('switch', '-q', 'side')
        self.write('b.txt', 'b')
        self.commit(MESSAGE)
        original = self.git('for-each-ref', '--format=%(refname:short)', 'refs/heads').splitlines()
        target = next(branch for branch in original if branch != 'side')
        self.git('merge', '--no-ff', '-m', MESSAGE, target)
        self.assertTrue(any('fusion' in error for error in self.check()[0]))

    def test_invalid_base_and_shallow_clone_fail(self):
        with self.assertRaises(ValueError):
            commits.check_range(self.root, 'absente', 'HEAD')
        clone = Path(self.tmp.name) / 'shallow'
        subprocess.run(['git', 'clone', '-q', '--depth=1', self.root.as_uri(), str(clone)], check=True)
        with self.assertRaisesRegex(ValueError, 'superficiel'):
            commits.check_range(clone, 'HEAD', 'HEAD')

    def test_cli_format_mode_and_unknown_base(self):
        path = Path(self.tmp.name) / 'message.txt'
        path.write_text(MESSAGE)
        with redirect_stdout(io.StringIO()):
            self.assertEqual(commits.main(['--message-file', str(path)]), 0)
        with patch.object(commits, 'ROOT', self.root), redirect_stderr(io.StringIO()):
            self.assertEqual(commits.main(['--base', 'inconnue']), 1)


if __name__ == '__main__':
    unittest.main()
