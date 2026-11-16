"""Tests du garde-fou README, en mémoire et dans un dépôt Git temporaire."""
from pathlib import Path
import sys
import tempfile
import unittest
import subprocess
from unittest.mock import patch
from contextlib import redirect_stdout, redirect_stderr
import io

scripts = Path(__file__).parents[1] / 'scripts'
sys.path.insert(0, str(scripts))
import check_readmes as checker

VALID = '''# Dossier

## Rôle et responsabilités

- Expliquer les responsabilités.

## Conventions techniques

### Convention lisible

Décrire le comportement attendu.

- Préciser son périmètre.
'''


class ReadmesTest(unittest.TestCase):
    def test_compliant_with_nested_examples_and_other_sections(self):
        self.assertEqual(checker.readme_errors(VALID + '\n#### Exemple\n\n```md\n# Faux titre\n```\n\n#### Précision\n\nContenu.\n'), [])

    def test_links_paths_and_temporary_content_are_rejected_everywhere(self):
        for text in ('[Guide](guide.md)', 'https://example.test', '<a href="guide">Guide</a>', '../source', 'scripts/check.py', '/home/personne', '2026-11-15', 'DEM-011', '130 tests réussis', 'Actuellement disponible', 'a' * 40):
            with self.subTest(text=text):
                self.assertTrue(checker.readme_errors(VALID + '\n' + text))
                self.assertTrue(checker.readme_errors(VALID + '\n```text\n' + text + '\n```'))

    def test_additional_readme_sections_are_rejected(self):
        self.assertTrue(checker.readme_errors(VALID + '\n## Commandes\n'))

    def test_missing_description_variants(self):
        for body in ('', '- Règle sans description.', '> Citation.', '| Table |', '[Renvoi](README.md)', '<!-- Commentaire -->', '    code_indenté()', '```sh\ncommande\n```\nTexte après exemple.'):
            with self.subTest(body=body):
                text = VALID.split('Décrire')[0] + body
                self.assertTrue(any('description' in msg for _, msg in checker.readme_errors(text)))

    def test_each_convention_needs_its_description(self):
        errors = checker.readme_errors(VALID + '\n### Autre\n\n- Détail.\n')
        self.assertTrue(any('description' in msg for _, msg in errors))

    def test_direct_conventions_and_wrong_heading_depth(self):
        for text in (VALID.replace('### Convention lisible\n\n', ''), VALID.replace('### Convention lisible', '#### Convention lisible')):
            with self.subTest(text=text):
                self.assertTrue(checker.readme_errors(text))

    def test_required_unique_headings_and_order(self):
        for text in (VALID.replace('# Dossier', 'Introduction'), VALID + '\n# Autre\n', VALID + '\n## Conventions techniques\n', VALID.replace('## Rôle et responsabilités', '## Autre'), VALID.replace('## Rôle et responsabilités', '## TEMP').replace('## Conventions techniques', '## Rôle et responsabilités').replace('## TEMP', '## Conventions techniques')):
            with self.subTest(text=text):
                self.assertTrue(checker.readme_errors(text))

    def test_responsibilities_are_a_list_without_links(self):
        for text in (VALID.replace('- Expliquer les responsabilités.', 'Un paragraphe.'), VALID.replace('- Expliquer les responsabilités.', '- [Renvoi](README.md)')):
            with self.subTest(text=text):
                self.assertTrue(checker.readme_errors(text))

    def test_fenced_and_commented_headings_do_not_count(self):
        self.assertEqual(checker.readme_errors(VALID + '\n~~~md\n# Faux\n~~~\n<!--\n# Faux\n-->\n'), [])

    def test_discovery_includes_untracked_and_case_insensitive(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(['git', 'init', '-q', directory], check=True)
            (root / '.gitignore').write_text('node_modules/\n.env*\n')
            for name in ('README.md', 'src/readme.MD', 'node_modules/pkg/README.md', 'worktree/web/README.md'):
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(VALID if name == 'README.md' else '# Invalide')
            with patch.object(checker, 'REPO_ROOT', root), redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
                self.assertEqual(checker.main(), 1)
                (root / 'src/readme.MD').write_text(VALID)
                self.assertEqual(checker.main(), 0)

    def test_readmes_below_first_level_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ('README.md', 'dev-book/README.md', 'dev-book/templates/README.md', 'dev-book/templates/deeper/readme.MD'):
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(VALID)
            errors, count = checker.check_readmes(root, [Path(name) for name in ('README.md', 'dev-book/README.md', 'dev-book/templates/README.md', 'dev-book/templates/deeper/readme.MD')])
            self.assertEqual(count, 3)
            self.assertEqual(len(errors), 2)
            self.assertTrue(all('deuxième niveau' in error for error in errors))

    def test_root_exception_and_common_base_specializations(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'README.md').write_text('# Présentation libre\n[Documentation](docs/index.md)')
            nested = root / 'webapp/base/components/README.md'
            nested.parent.mkdir(parents=True)
            nested.write_text(VALID)
            paths = [Path('README.md'), Path('webapp/base/components/README.md')]
            self.assertEqual(checker.check_readmes(root, paths), ([], 1))
            self.assertEqual(checker.check_readmes(root, [Path('README.md')]), ([], 0))
            nested.write_text(VALID + '\nhttps://example.test')
            self.assertTrue(checker.check_readmes(root, paths)[0])

    def test_explicit_webapp_owners_do_not_allow_deeper_technical_readmes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            allowed = ['webapp/dashboard/README.md', 'webapp/services/README.md',
                       'webapp/shared/README.md', 'webapp/schemas/README.md',
                       'webapp/server/README.md', 'webapp/sites/README.md',
                       'webapp/sites/showcase-immobilier/README.md',
                       'webapp/sites/client2-immobilier/README.md']
            denied = 'webapp/server/utils/README.md'
            for name in [*allowed, denied]:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(VALID)
            self.assertEqual(checker.check_readmes(root, [Path(p) for p in allowed])[0], [])
            self.assertTrue(any('deuxième niveau' in error for error in checker.check_readmes(root, [Path(denied)])[0]))

    def test_empty_inventory_fails(self):
        self.assertTrue(checker.check_readmes(Path('/tmp'), [])[0])

    def test_symlink_and_invalid_encoding_fail(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'bad').mkdir()
            (root / 'README.md').write_text(VALID)
            (root / 'bad/README.md').write_bytes(b'\xff')
            (root / 'other').mkdir()
            (root / 'other/README.md').symlink_to(root / 'README.md')
            errors, count = checker.check_readmes(root, [Path('README.md'), Path('bad/README.md'), Path('other/README.md')])
            self.assertEqual(count, 1)
            self.assertEqual(len(errors), 2)

    def test_git_failure_is_not_success(self):
        with patch.object(checker.subprocess, 'check_output', side_effect=OSError('git indisponible')), redirect_stderr(io.StringIO()):
            self.assertEqual(checker.main(), 1)


if __name__ == '__main__':
    unittest.main()
