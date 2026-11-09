"""Cas conformes, écarts et exclusions du contrôle documentaire."""
from pathlib import Path as _Path
import sys as _sys
_common = _Path(__file__).resolve().parent
if not (_common / 'bootstrap.py').is_file():
    _common = next((p / 'codebase-integrity/commun' for p in _Path(__file__).resolve().parents if (p / 'codebase-integrity/commun').is_dir()), _common)
_sys.path.insert(0, str(_common))
from bootstrap import REPO_ROOT, configure_imports
configure_imports()

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

    def write(self, name, text):
        relative = Path(name)
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        self.paths.append(relative)
        return path

    def check(self):
        return docs.check(self.root, self.paths)

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
        self.assertIn('cible absente', self.check()[0][0])

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
