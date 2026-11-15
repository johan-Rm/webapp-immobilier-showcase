"""Contrats des métadonnées et traces, dans des dépôts Git jetables."""
import importlib.util
from pathlib import Path
import tempfile
import subprocess
import unittest
import json
import hashlib

spec = importlib.util.spec_from_file_location('check_devbook', Path(__file__).parents[1] / 'scripts/check_devbook.py')
control = importlib.util.module_from_spec(spec)
spec.loader.exec_module(control)
VALID = '''# Carte

- Session de création : 01a1d56d-446b-7931-bf53-7687a7d10912
- Branche : layers/devops
- Worktree : worktree/devops
- Chemins autorisés : fichier.txt
- Dépendances : aucune

## Verdict humain

Aucun verdict.
'''


class DevbookTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git('init', '-q')
        self.git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-q', '--allow-empty', '-m', 'base')
        self.base = self.git('rev-parse', 'HEAD').strip()

    def git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.root, stderr=subprocess.PIPE, text=True)

    def card(self, text=VALID, name='OPS-999-test.md'):
        path = self.root / 'dev-book/tasks' / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        return path

    def verdict(self, record):
        return VALID.replace('Aucun verdict.', '```verdict-json\n' + json.dumps(record) + '\n```')

    def test_valid_pending_card_and_zero_changed_cards(self):
        self.assertEqual(control.check(self.root, self.base), ([], 0))
        self.card()
        self.assertEqual(control.check(self.root, self.base), ([], 1))

    def test_each_missing_metadata_fails_and_fixtures_do_not_supply_it(self):
        for line in VALID.splitlines():
            if line.startswith('- '):
                with self.subTest(line=line):
                    text = VALID.replace(line, '') + '\n```md\n' + line + '\n```'
                    self.assertTrue(control.card_errors(text, self.root))

    def test_unknown_verdict_fails_without_inventing_a_decision(self):
        self.assertTrue(control.card_errors(VALID.replace('Aucun verdict.', 'Validé.'), self.root))
        self.assertTrue(control.card_errors(VALID.replace('## Verdict humain', '## Autre'), self.root))

    def test_git_reference_and_scope(self):
        record = {'decision': 'validé', 'portee': 'Cette carte', 'contenu': {'type': 'git', 'valeur': self.base}}
        self.assertEqual(control.card_errors(self.verdict(record), self.root), [])
        for value in ('HEAD', 'f' * 40):
            record['contenu']['valeur'] = value
            self.assertTrue(control.card_errors(self.verdict(record), self.root))
        record.pop('portee')
        self.assertTrue(control.card_errors(self.verdict(record), self.root))

    def test_checksum_detects_changed_content(self):
        proof = self.root / 'proof.txt'
        proof.write_text('contenu examiné')
        record = {'decision': 'validé', 'portee': 'Cette carte', 'contenu': {'type': 'sha256', 'valeur': hashlib.sha256(proof.read_bytes()).hexdigest(), 'fichier': 'proof.txt'}}
        self.assertEqual(control.card_errors(self.verdict(record), self.root), [])
        proof.write_text('autre contenu')
        self.assertTrue(control.card_errors(self.verdict(record), self.root))
        record['contenu']['fichier'] = '../proof.txt'
        self.assertTrue(control.card_errors(self.verdict(record), self.root))

    def test_deleted_and_renamed_cards_fail_but_unchanged_history_is_not_reinterpreted(self):
        path = self.card('# Ancienne carte')
        self.git('add', '.')
        self.git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'carte')
        base = self.git('rev-parse', 'HEAD').strip()
        self.assertEqual(control.check(self.root, base), ([], 0))
        path.rename(path.with_name('OPS-998-renamed.md'))
        errors, _ = control.check(self.root, base)
        self.assertTrue(any('suppression ou renommage' in e for e in errors))

    def test_changed_card_is_checked_including_staged_content(self):
        self.card()
        self.git('add', '.')
        self.git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'carte')
        base = self.git('rev-parse', 'HEAD').strip()
        self.card('# Carte incomplète')
        self.git('add', '.')
        self.assertTrue(control.check(self.root, base)[0])

    def test_missing_base_and_symbolic_card_fail(self):
        with self.assertRaises(ValueError):
            control.check(self.root, 'HEAD')
        path = self.card()
        path.unlink()
        target = self.root / 'elsewhere'
        target.write_text(VALID)
        path.symlink_to(target)
        self.assertTrue(control.check(self.root, self.base)[0])


if __name__ == '__main__':
    unittest.main()
