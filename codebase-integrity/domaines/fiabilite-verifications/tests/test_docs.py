"""Cas conformes, écarts et exclusions du contrôle documentaire."""
from pathlib import Path as _Path
import sys as _sys
_common = _Path(__file__).resolve().parent
if not (_common / 'bootstrap.py').is_file():
    _common = next((p / 'codebase-integrity/commun' for p in _Path(__file__).resolve().parents if (p / 'codebase-integrity/commun').is_dir()), _common)
_sys.path.insert(0, str(_common))
from bootstrap import REPO_ROOT, configure_imports
configure_imports()

import io
from contextlib import redirect_stdout, redirect_stderr
from unittest.mock import patch
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('check_docs', Path(__file__).parents[1] / 'scripts/check_docs.py')
docs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(docs)


class DocumentsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.paths = []

    def test_documentation_tree_checks_navigation_and_local_links(self):
        self.write('docs/README.md', '# Documentation')
        self.write('docs/index.md', '[Guide](1.guide/index.md)')
        self.write('docs/1.guide/index.md', '[Page](nested/page.md)')
        self.write('docs/1.guide/nested/page.md', '# Page\n[Lien](#page)')
        self.write('docs/1.guide/.navigation.yml', 'title: Guide')
        self.write('docs/1.guide/nested/README.md', '# Notes')
        self.write('docs/1.guide/nested/index.md', '# Sommaire')
        self.assertEqual(docs.check_documentation_tree(self.root, self.paths), ([], []))

        self.write('docs/supplement.txt', 'écart')
        self.write('docs/autre/index.md', '# Autre')
        self.write('docs/1.guide/omise.md', '[Cible](absente.md)\n[Ancre](#absente)')
        errors, _ = docs.check_documentation_tree(self.root, self.paths)
        self.assertEqual(len(errors), 5)
        for diagnostic in ('fichier inattendu', 'index absent du sommaire principal',
                           'page absente du sommaire', 'cible absente', 'ancre absente'):
            self.assertTrue(any(diagnostic in error for error in errors), errors)

    def test_root_guides_check_commands_and_links(self):
        self.write('Makefile', 'setup:\n')
        makefile = self.write('infra/make/Makefile.dev', 'test-up:\nruntime-tests-browser:\n'
                              'runtime-tests-load:\nruntime-tests-lighthouse:\nWEBAPP_TEST_PORT ?= 19856\n')
        recipe = (
            " [Référence](SETUP.md)\n\n"
            "```bash\n"
            "make test-up\n"
            "make runtime-tests-browser WEBAPP_BASE_URL=http://127.0.0.1:19856\n"
            "make runtime-tests-load WEBAPP_BASE_URL=http://127.0.0.1:19856\n"
            "make runtime-tests-lighthouse WEBAPP_BASE_URL=http://127.0.0.1:19856 PROFILE=mobile\n"
            "make runtime-tests-lighthouse WEBAPP_BASE_URL=http://127.0.0.1:19856 PROFILE=desktop\n"
            "# make inactive\n"
            "```\n"
        )
        self.write('SETUP.md', '```bash\nmake setup\n```\n')
        guide = self.write('TEST.md', recipe)
        self.assertEqual(docs.check(self.root, self.paths), ([], []))
        for original, replacement, message in (
            ('SETUP.md', 'absent.md', 'absent.md'),
            ('make runtime-tests-browser', 'make ancienne-cible', 'cible Make inconnue'),
            ('http://127.0.0.1:19856', 'http://127.0.0.1:8080', 'origine des fixtures'),
            ('WEBAPP_BASE_URL=', 'OLD_BASE_URL=', 'origine des fixtures'),
            ('# make inactive', 'if true; then', 'bloc Bash invalide'),
            ('make test-up', 'make test-up WEBAPP_TEST_PORT=19856', 'sans paramètre'),
        ):
            with self.subTest(message=message):
                guide.write_text(recipe.replace(original, replacement))
                errors, _ = docs.check(self.root, self.paths)
                self.assertTrue(any(message in error for error in errors), errors)
        guide.write_text(recipe)
        declaration = makefile.read_text()
        makefile.write_text(declaration.replace('19856', '19854'))
        errors, _ = docs.check(self.root, self.paths)
        self.assertEqual(sum('origine des fixtures attendue' in error for error in errors), 4)
        makefile.write_text(declaration.replace('WEBAPP_TEST_PORT ?= 19856', ''))
        errors, _ = docs.check(self.root, self.paths)
        self.assertTrue(any('port par défaut des fixtures introuvable' in error for error in errors))

    def write(self, name, text):
        relative = Path(name)
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        self.paths.append(relative)
        return path

    def check(self):
        return docs.check(self.root, self.paths)

    def test_dashboard_cards_are_discovered_by_cli(self):
        self.write('docs/README.md', '# Documentation\n\n## Rôle et responsabilités\n\n- Expliquer.\n\n## Conventions techniques\n\n### Sources\n\nUne référence par règle.\n')
        self.write('docs/index.md', '# Sommaire\n')
        card = self.write('dev-book/tasks/DASH-001-exemple.md',
                          '# Carte\n[Documentation](../../docs/README.md#documentation)')
        listing = b''.join(path.as_posix().encode() + b'\0' for path in self.paths)
        with patch.object(docs, 'REPO_ROOT', self.root), \
             patch.object(docs.subprocess, 'check_output', return_value=listing), \
             redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()):
            self.assertEqual(docs.main(), 0)
            card.write_text('# Carte\n[Cassé](absent.md)')
            self.assertEqual(docs.main(), 1)

    def test_compliant_document_and_navigation(self):
        self.write('docs/sujet.md', '# Sujet\n\n> Résumé.\n\n## Détails\nExplication.\n')
        self.write('docs/index.md', '# Navigation\n\n- [Sujet](sujet.md) : explication brève.\n')
        self.assertEqual(self.check(), ([], []))

    def test_numbered_first_level_theme_is_rejected(self):
        self.write('docs/01-architecture/sujet.md', '# Sujet\n\n> Résumé.\n')
        self.assertIn('premier niveau', self.check()[0][0])

    def test_numbered_pillars_and_steps_are_allowed(self):
        self.write('docs/architecture/02-cadre/01-piliers.md', '# Piliers\n\n> Résumé.\n')
        self.write('docs/architecture/03-developpement-loop/01-interview.md', '# Interview\n\n> Résumé.\n')
        self.write('docs/01-sujet.md', '# Sujet\n\n> Résumé.\n')
        self.assertEqual(self.check(), ([], []))

    def test_demands_and_readme_exempt_from_names_or_quote(self):
        self.write('dev-book/demand/DEM-021.md', '# Demande\nTexte.\n')
        self.write('docs/README.md', '# Documentation\nTexte.\n')
        self.assertEqual(self.check(), ([], []))

    def test_quote_required_at_document_start_only(self):
        self.write('docs/sujet.md', '# Sujet\n\n> Résumé.\n\n## Une section\nSans citation.\n')
        self.assertEqual(self.check(), ([], []))
        self.write('docs/autre.md', '# Autre\n\nIntroduction.\n\n> Trop tard.\n')
        self.assertIn('citation requise', self.check()[0][0])

    def test_index_rejects_explanation_and_commands(self):
        for content in ['# Index\n\nParagraphe.\n', '# Index\n\n```sh\ncommande\n```\n']:
            with self.subTest(content=content):
                self.write('docs/index.md', content)
                self.assertTrue(self.check()[0])

    def test_index_table_navigation(self):
        self.write('docs/sujet.md', '# Sujet\n\n> Résumé.\n')
        self.write('docs/index.md', '# Index\n\n| Document | Description |\n| --- | --- |\n| [Sujet](sujet.md) | Humain |\n')
        self.assertEqual(self.check(), ([], []))

    def test_all_markdown_including_historical_is_checked(self):
        self.write('dev-book/tasks/OPS-001.md', '[preuve](absent.md)')
        self.assertIn('cible absente', self.check()[0][0])

    def test_historical_literal_is_not_a_link(self):
        self.write('dev-book/tasks/OPS-001.md', 'Ancien chemin : `docs/01-cadre/absent.md`.')
        self.assertEqual(self.check(), ([], []))

    def test_code_fences_tildes_and_inline_code_ignored(self):
        text = '~~~md\n[lien](absent.md)\n~~~\n`[exemple](absent.md)`\n``[autre](absent.md)``'
        self.assertEqual(docs.links(text), [])

    def test_parentheses_and_angle_destinations_and_titles(self):
        self.write('charte (original).html', '<h1 id="id">Charte</h1>')
        self.write('sujet.md', '[A](<charte (original).html#id>)\n[B](charte%20(original).html "Titre")')
        self.assertEqual(self.check(), ([], []))

    def test_explicit_collapsed_and_shortcut_references(self):
        self.write('cible.md', '# Cible')
        self.write('source.md', '[explicite][X]\n[x][]\n[x]\n\n[x]: cible.md "Titre"')
        self.assertEqual(self.check(), ([], []))

    def test_undefined_reference_fails(self):
        self.write('source.md', '[texte][absent]')
        self.assertIn('référence non définie', self.check()[0][0])

    def test_images_are_checked(self):
        self.write('source.md', '![image](absente.png)')
        self.assertIn('cible absente', self.check()[0][0])

    def test_accents_formatting_and_duplicate_anchors(self):
        self.write('cible.md', '# État **du** `code`\n## Même titre\n## Même titre\n')
        self.write('source.md', '[A](cible.md#état-du-code) [B](cible.md#même-titre-1)')
        self.assertEqual(self.check(), ([], []))

    def test_missing_anchor_and_percent_encoding(self):
        self.write('cible.md', '# État')
        p = self.write('source.md', '[A](cible.md#%C3%A9tat)')
        self.assertEqual(self.check(), ([], []))
        p.write_text('[A](cible.md#autre)')
        self.assertIn('ancre absente', self.check()[0][0])

    def test_html_links_and_explicit_id(self):
        self.write('cible.html', '<div id="état"></div>')
        self.write('source.md', '<a href="cible.html#état">Lire</a>')
        self.assertEqual(self.check(), ([], []))

    def test_explicit_html_anchor_in_markdown(self):
        self.write('source.md', '<a id="preuve"></a>\n[preuve](#preuve)')
        self.assertEqual(self.check(), ([], []))

    def test_external_urls_are_not_requested(self):
        self.write('source.md', '[Web](https://invalid.example/#absent) [Mail](mailto:test@example.org)')
        self.assertEqual(self.check(), ([], []))

    def test_dynamic_target_reported_as_unverified(self):
        self.write('source.md', '[variable](${cible}.md)')
        errors, notices = self.check()
        self.assertEqual(errors, [])
        self.assertIn('dynamique', notices[0])

    def test_non_document_anchor_reported_as_unverified(self):
        self.write('source.md', '[image](image.svg#partie)')
        self.write('image.svg', '<svg/>')
        errors, notices = self.check()
        self.assertEqual(errors, [])
        self.assertIn('ancre non vérifiée', notices[0])

    def test_worktree_copies_and_env_are_excluded(self):
        self.write('worktree/api/docs/index.md', '[cassé](absent.md)')
        self.write('.env.md', '[secret](absent.md)')
        self.assertEqual(self.check(), ([], []))
        self.write('worktree/README.md', '[cassé](absent.md)')
        self.assertEqual(self.check(), ([], []))

    def test_target_outside_repository_is_rejected(self):
        self.write('source.md', '[extérieur](../absent.md)')
        self.assertIn('hors dépôt', self.check()[0][0])

    def test_symlink_not_traversed(self):
        self.write('cible.md', '# Cible')
        (self.root / 'lien.md').symlink_to(self.root / 'cible.md')
        self.paths.append(Path('lien.md'))
        self.assertIn('symbolique', self.check()[0][0])

    def test_deleted_path_is_not_read(self):
        self.paths.append(Path('supprime.md'))
        self.assertEqual(self.check(), ([], []))

    def test_invalid_utf8_fails(self):
        p = self.write('invalide.md', '')
        p.write_bytes(b'\xff')
        self.assertIn('analyse impossible', self.check()[0][0])

    def test_unclosed_link_fails(self):
        self.write('source.md', '[cassé](fichier.md')
        self.assertIn('non fermé', self.check()[0][0])


if __name__ == '__main__':
    unittest.main()
