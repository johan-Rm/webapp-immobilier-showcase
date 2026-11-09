"""Préparation idempotente et refus des destinations partagées, sans services."""
from pathlib import Path as _Path
import sys as _sys
_common = _Path(__file__).resolve().parent
if not (_common / 'bootstrap.py').is_file():
    _common = next((p / 'codebase-integrity/commun' for p in _Path(__file__).resolve().parents if (p / 'codebase-integrity/commun').is_dir()), _common)
_sys.path.insert(0, str(_common))
from bootstrap import REPO_ROOT, configure_imports
configure_imports()

import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = REPO_ROOT
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import environment as env
import worktrees as wt


class Environments(unittest.TestCase):
    def setUp(self):
        folder = tempfile.TemporaryDirectory(prefix='aide-env-')
        self.addCleanup(folder.cleanup)
        self.root = Path(folder.name) / 'projet avec espaces'
        self.root.mkdir()
        wt.git(self.root, 'init', '-b', 'develop')
        wt.git(self.root, 'config', 'user.name', 'Test')
        wt.git(self.root, 'config', 'user.email', 'test@example.invalid')
        (self.root / 'infra/config').mkdir(parents=True)
        (self.root / 'infra/config/layers.json').write_text((ROOT / 'infra/config/layers.json').read_text())
        (self.root / 'webapp').mkdir()
        (self.root / 'AGENTS.md').write_text('Contexte du dépôt de test')
        (self.root / 'webapp/package.json').write_text('{}')
        (self.root / 'webapp/.env.example').write_text((ROOT / 'webapp/.env.example').read_text())
        (self.root / 'webapp/.env').write_text('SECRET_DU_PRINCIPAL=ne-pas-copier\n')
        (self.root / '.gitignore').write_text('/worktree/*\nwebapp/.env\n')
        wt.git(self.root, 'add', '.')
        wt.git(self.root, 'commit', '-m', 'base')

    def lane(self, name='web'):
        return wt.add(self.root, name, 'layers/' + name, 'develop')[0]

    def test_prepare_preserves_existing_values_and_does_not_copy_secrets(self):
        lane = self.lane()
        path, created = env.prepare(lane, 'web')
        self.assertTrue(created)
        self.assertTrue((lane / 'webapp/.data').is_dir())
        (lane / 'webapp/.data/host-write').write_text('accessible avant Docker')
        self.assertTrue((lane / 'webapp/public/images').is_dir())
        self.assertNotIn('ne-pas-copier', path.read_text())
        self.assertEqual(path.stat().st_mode & 0o777, 0o600)
        original = path.read_text() + '\nLOCAL=conserver\n'
        path.write_text(original)
        self.assertEqual(env.prepare(lane, 'web'), (path, False))
        self.assertEqual(path.read_text(), original)
        self.assertEqual(env.read_values(path)['SYMFONY_SERVICE_PASSWORD'], '')

    def test_two_layers_have_distinct_projects_ports_and_local_destinations(self):
        first, second = self.lane('web'), self.lane('bff')
        a, _ = env.prepare(first, 'web')
        b, _ = env.prepare(second, 'bff')
        one, two = env.read_values(a), env.read_values(b)
        for key in ['COMPOSE_PROJECT_NAME', 'WEBAPP_DEV_PORT', 'PUBLIC_PORT', 'NUXT_SESSION_PASSWORD']:
            self.assertNotEqual(one[key], two[key])
        for key in ['CONTENT_HOST_DIR', 'MEDIA_HOST_DIR', 'DATA_HOST_DIR']:
            self.assertNotEqual((first / one[key]).resolve(), (second / two[key]).resolve())

    def test_wrong_branch_preserves_principal_env(self):
        before = (self.root / 'webapp/.env').read_text()
        with self.assertRaisesRegex(ValueError, 'Branche'):
            env.prepare(self.root, 'web')
        self.assertEqual((self.root / 'webapp/.env').read_text(), before)

    def test_symbolic_data_destination_is_rejected_before_env_creation(self):
        lane = self.lane()
        (lane / 'webapp/.data').symlink_to(self.root, target_is_directory=True)
        with self.assertRaises(ValueError): env.prepare(lane, 'web')
        self.assertFalse((lane / 'webapp/.env').exists())

    def test_existing_env_symlink_is_preserved(self):
        lane = self.lane()
        target = self.root / 'webapp/.env'
        (lane / 'webapp/.env').symlink_to(target)
        with self.assertRaises(ValueError): env.prepare(lane, 'web')
        self.assertIn('ne-pas-copier', target.read_text())

    def test_outside_media_path_is_rejected_without_rewriting_env(self):
        lane = self.lane()
        path, _ = env.prepare(lane, 'web')
        raw = path.read_text().replace('MEDIA_HOST_DIR=./webapp/public/images', 'MEDIA_HOST_DIR=../../shared')
        path.write_text(raw)
        with self.assertRaisesRegex(ValueError, 'hors du worktree'): env.validate(lane, 'web')
        self.assertEqual(path.read_text(), raw)

    def test_duplicate_ids_are_rejected_before_writing(self):
        lane = self.lane()
        path = lane / 'infra/config/layers.json'
        settings = json.loads(path.read_text())
        settings['layers']['bff']['id'] = settings['layers']['web']['id']
        path.write_text(json.dumps(settings))
        with self.assertRaisesRegex(ValueError, 'dupliqués'): env.prepare(lane, 'web')
        self.assertFalse((lane / 'webapp/.env').exists())


if __name__ == '__main__':
    unittest.main()
