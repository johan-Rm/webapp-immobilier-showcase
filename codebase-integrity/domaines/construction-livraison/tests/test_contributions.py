"""Contributions et contrôle de confiance dans des dépôts jetables."""
from pathlib import Path as _Path
import sys as _sys
_common = _Path(__file__).resolve().parent
if not (_common / 'bootstrap.py').is_file():
    _common = next((p / 'codebase-integrity/commun' for p in _Path(__file__).resolve().parents if (p / 'codebase-integrity/commun').is_dir()), _common)
_sys.path.insert(0, str(_common))
from bootstrap import REPO_ROOT, configure_imports
configure_imports()

import contextlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[1] / 'scripts'
sys.path.insert(0, str(SCRIPTS))
import check_contributions as contributions
import contribution as trusted


class Contributions(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'repo'
        self.root.mkdir()
        self.git('init', '-q')
        self.git('config', 'user.name', 'Fixture')
        self.git('config', 'user.email', 'fixture@example.invalid')
        self.git('config', 'commit.gpgsign', 'false')
        for name in trusted.MODULES:
            self.write(trusted.MODULE_PATHS[name], (REPO_ROOT / trusted.MODULE_PATHS[name]).read_text())
        self.write('code.py', 'old\n')
        self.write('test.py', 'old test\n')
        self.write('README.md', '# Fixture\n\n## Conventions techniques\n\n### Contrat\nRègle.\n')
        self.base = self.commit('historique')
        self.demand = 'dev-book/demand/DEM-001-fixture.md'
        self.card = 'dev-book/tasks/OPS-079-fixture.md'
        self.kind = 'développement'
        self.manifest = None
        self.metadata()

    def git(self, *args):
        return contributions.commits.git(self.root, *args).strip()

    def write(self, path, text):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text)

    def metadata(self):
        text = '# Demande\n\n- Type : ' + self.kind + '\n'
        if self.manifest is not None:
            text += '\n## Contribution\n\n```contribution-json\n' + json.dumps(self.manifest) + '\n```\n'
        self.write(self.demand, text)
        self.write(self.card, '# Carte\n\n- Demande : DEM-001\n\n## Mission\n')

    def commit(self, message='feat(OPS-079): modifier le contrat\n\nDemande : DEM-001'):
        self.git('add', '.')
        self.git('commit', '-qm', message, '--allow-empty')
        return self.git('rev-parse', 'HEAD')

    def check(self, head='HEAD', base=None):
        return contributions.check(self.root, base or self.base, head)

    def corrective(self):
        self.kind = 'consolidation'
        self.manifest = {'version': 1, 'corrections': [{
            'chemins': ['code.py', 'test.py'], 'convention': 'README.md#contrat', 'controles': ['test.py']}],
            'accompagnements': [], 'sans_correction': ''}
        self.write('code.py', 'new\n')
        self.write('test.py', 'new test\n')
        self.metadata()

    def test_development_and_dirty_worktree_use_requested_head(self):
        self.write('code.py', 'new\n')
        head = self.commit()
        self.write(self.demand, '- Type : autre')
        self.write('codebase-integrity/domaines/construction-livraison/scripts/check_contributions.py', 'raise RuntimeError()')
        self.assertEqual(self.check(head), 1)
        self.commit('docs(DEM-001): consigner les preuves')
        self.assertEqual(self.check(head), 1)

    def test_protected_add_modify_delete_rename_mode_and_symlink(self):
        for action in ('add', 'modify', 'delete', 'in', 'out', 'mode', 'symlink'):
            with self.subTest(action=action):
                # Chaque cas reste un commit interdit dans sa propre branche de fixture.
                self.git('checkout', '-q', '--detach', self.base)
                self.metadata()
                old = self.root / 'codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py'
                if action == 'add':
                    self.write('codebase-integrity/new.py', 'new')
                elif action == 'modify':
                    old.write_text('modified')
                elif action == 'delete':
                    old.unlink()
                elif action == 'in':
                    self.git('mv', 'code.py', 'codebase-integrity/code.py')
                elif action == 'out':
                    self.git('mv', str(old.relative_to(self.root)), 'outside.py')
                elif action == 'mode':
                    old.chmod(0o755)
                else:
                    old.unlink()
                    old.symlink_to('../../code.py')
                self.commit()
                with self.assertRaisesRegex(ValueError, 'touchant'):
                    self.check()

    def test_reverted_protected_change_is_rejected(self):
        original = (self.root / 'codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py').read_text()
        self.write('codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py', 'bad')
        self.commit()
        self.write('codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py', original)
        self.commit()
        with self.assertRaisesRegex(ValueError, 'touchant'):
            self.check()

    def test_consolidation_existing_and_new_convention(self):
        self.corrective()
        self.commit()
        self.assertEqual(self.check(), 1)
        self.write('README.md', '# Fixture\n\n## Conventions techniques\n\n### Nouvelle\nRègle.\n')
        self.manifest['corrections'][0]['convention'] = 'README.md#nouvelle'
        self.manifest['accompagnements'] = [{'chemins': ['README.md'], 'motif': 'Convention nouvelle'}]
        self.metadata()
        self.commit()
        self.assertEqual(self.check(), 2)

    def test_without_code_requires_reason_and_complete_accompaniments(self):
        self.kind = 'consolidation'
        self.write('guide.md', 'Documentation')
        self.manifest = {'version': 1, 'corrections': [], 'accompagnements': [
            {'chemins': ['guide.md'], 'motif': 'Clarification'}],
            'sans_correction': 'sans correction de code : documentation seule'}
        self.metadata()
        self.commit()
        self.assertEqual(self.check(), 1)
        self.manifest['sans_correction'] = ''
        self.metadata()
        self.commit()
        with self.assertRaisesRegex(ValueError, 'motif'):
            self.check()

    def test_convention_duplicate_titles_keep_document_anchor_numbers(self):
        self.corrective()
        self.write('README.md', '# Fixture\n\n## Rôle et responsabilités\n\n### Contrat\nDescription.\n'
                   '\n## Conventions techniques\n\n### Contrat\nRègle.\n'
                   '\n## Autre\n\n### Contrat\nAutre description.\n')
        self.manifest['accompagnements'] = [{'chemins': ['README.md'], 'motif': 'Convention'}]
        for anchor, accepted in (('contrat', False), ('contrat-1', True), ('contrat-2', False)):
            self.manifest['corrections'][0]['convention'] = 'README.md#' + anchor
            self.metadata()
            self.commit()
            with self.subTest(anchor=anchor):
                if accepted:
                    self.assertEqual(self.check(), 2)
                else:
                    with self.assertRaisesRegex(ValueError, 'ancre de convention absente'):
                        self.check()

    def test_invalid_or_missing_declaration(self):
        self.kind = 'consolidation'
        self.metadata()
        self.commit()
        with self.assertRaisesRegex(ValueError, 'déclaration'):
            self.check()
        for text in ('```contribution-json\n{}\n```',
                     '```contribution-json\n{"version":1,"version":1}\n```',
                     '```contribution-json\n{}',
                     '```md\n```contribution-json\n{}\n```\n```'):
            with self.subTest(text=text), self.assertRaises(ValueError):
                contributions.declaration(text)

    def test_schema_is_strict(self):
        self.corrective()
        original = json.dumps(self.manifest)
        variants = [dict(self.manifest, version=True), dict(self.manifest, version=2),
                    dict(self.manifest, unexpected=1), dict(self.manifest, corrections={}),
                    dict(self.manifest, sans_correction='contradiction')]
        for manifest in variants:
            self.manifest = manifest
            self.metadata()
            self.commit()
            with self.subTest(manifest=manifest), self.assertRaises(ValueError):
                self.check()
        self.manifest = json.loads(original)

    def test_missing_or_unchanged_controls_and_conventions(self):
        self.corrective()
        self.commit()
        for target in ('README.md#absente', 'absent/README.md#contrat', 'code.py#contrat'):
            self.manifest['corrections'][0]['convention'] = target
            self.metadata()
            self.commit()
            with self.subTest(target=target), self.assertRaises(ValueError):
                self.check()
        self.manifest['corrections'][0]['convention'] = 'README.md#contrat'
        for control in ('absent.py', 'README.md'):
            self.manifest['corrections'][0]['controles'] = [control]
            self.metadata()
            self.commit()
            with self.subTest(control=control), self.assertRaises(ValueError):
                self.check()

    def test_coverage_unknown_and_duplicate_paths(self):
        self.corrective()
        for paths in (['code.py'], ['code.py', 'test.py', 'absent'], ['code.py', 'code.py']):
            self.manifest['corrections'][0]['chemins'] = paths
            self.metadata()
            self.commit()
            with self.subTest(paths=paths), self.assertRaises(ValueError):
                self.check()

    def test_invalid_types_and_reference_conflicts(self):
        for fields in ('', '- Type : autre', '- Type : consolidation\n- Type : développement'):
            self.write(self.demand, '# Demande\n' + fields)
            self.commit()
            with self.subTest(fields=fields), self.assertRaises(ValueError):
                self.check()
        self.metadata()
        self.write(self.card, '# Carte\n- Demande : DEM-099')
        self.commit()
        with self.assertRaisesRegex(ValueError, 'rattachement'):
            self.check()

    def test_missing_ambiguous_and_symbolic_documents(self):
        self.commit()
        self.write('dev-book/demand/DEM-001-duplicate.md', '# Demande\n- Type : développement')
        self.commit()
        with self.assertRaisesRegex(ValueError, 'ambigu'):
            self.check()
        (self.root / 'dev-book/demand/DEM-001-duplicate.md').unlink()
        (self.root / self.demand).unlink()
        (self.root / self.demand).symlink_to('../../README.md')
        self.commit()
        with self.assertRaisesRegex(ValueError, 'régulier'):
            self.check()
        (self.root / self.demand).unlink()
        self.commit()
        with self.assertRaisesRegex(ValueError, 'absent'):
            self.check()

    def test_type_changes_in_base_and_intermediate_commit(self):
        self.commit()
        self.kind = 'consolidation'
        self.metadata()
        self.commit()
        with self.assertRaisesRegex(ValueError, 'changement de type'):
            self.check()
        # Une base contenant déjà la demande est également protégée.
        old = self.git('rev-parse', 'HEAD^')
        with self.assertRaisesRegex(ValueError, 'changement de type'):
            self.check(base=old)

    def test_mixed_contribution_is_rejected(self):
        self.commit()
        self.write('dev-book/demand/DEM-029-fixture.md', '# Demande\n- Type : consolidation\n')
        self.commit('docs(DEM-029): déclarer une seconde demande')
        with self.assertRaisesRegex(ValueError, 'mélange'):
            self.check()

    def test_advanced_target_does_not_add_foreign_changes(self):
        self.write('code.py', 'candidate')
        head = self.commit()
        self.git('checkout', '-q', '--detach', self.base)
        self.write('codebase-integrity/target.py', 'target')
        target = self.commit('historique cible')
        self.assertEqual(self.check(head, target), 1)

    def test_paths_with_shell_metacharacters_and_deleted_correction(self):
        self.corrective()
        path = 'odd $(false); `false`\nname.py'
        self.write(path, 'new')
        (self.root / 'code.py').unlink()
        self.manifest['corrections'][0]['chemins'].append(path)
        self.metadata()
        self.commit()
        self.assertEqual(self.check(), 1)

    def test_invalid_base_empty_range_and_shallow_clone(self):
        self.commit()
        with self.assertRaises(ValueError):
            self.check(base='absente')
        with self.assertRaisesRegex(ValueError, 'plage vide'):
            self.check(self.base)
        clone = Path(self.tmp.name) / 'shallow'
        subprocess.run(['git', 'clone', '-q', '--depth=1', self.root.as_uri(), str(clone)], check=True)
        with self.assertRaisesRegex(ValueError, 'superficiel'):
            contributions.check(clone, 'HEAD', 'HEAD')

    def test_trusted_base_rejects_neutralized_candidate(self):
        self.write('codebase-integrity/domaines/construction-livraison/scripts/check_contributions.py', 'raise SystemExit(0)')
        head = self.commit()
        with self.assertRaises(subprocess.CalledProcessError):
            trusted.run(self.root, self.base, head)

    def test_trusted_base_accepts_valid_candidate(self):
        self.write('code.py', 'candidate')
        head = self.commit()
        self.assertEqual(trusted.run(self.root, self.base, head).returncode, 0)

    def test_extracted_policy_ignores_common_modules_in_parent_directories(self):
        self.write('code.py', 'candidate')
        head = self.commit()
        with tempfile.TemporaryDirectory(dir=self.tmp.name) as parent:
            foreign = Path(parent) / 'codebase-integrity/commun'
            foreign.mkdir(parents=True)
            (foreign / 'bootstrap.py').write_text('raise RuntimeError("module étranger")')
            with tempfile.TemporaryDirectory(dir=parent) as extraction:
                with patch.object(trusted.tempfile, 'TemporaryDirectory', return_value=contextlib.nullcontext(extraction)):
                    self.assertEqual(trusted.run(self.root, self.base, head).returncode, 0)

    def test_first_install_and_symlink_policy_are_blocking(self):
        for name in ('check_contributions.py', 'check_docs.py'):
            target = self.root / trusted.MODULE_PATHS[name]
            target.unlink()
        base = self.commit('historique sans contrôle')
        with contextlib.redirect_stderr(io.StringIO()) as output:
            self.assertEqual(trusted.main(['--repo', str(self.root), '--base', base]), 1)
        self.assertIn('amorçage', output.getvalue())
        target = self.root / 'codebase-integrity/domaines/construction-livraison/scripts/check_contributions.py'
        target.symlink_to('check_commits.py')
        base = self.commit('historique avec lien')
        with self.assertRaisesRegex(ValueError, 'non régulier'):
            trusted.run(self.root, base, base)

    def test_main_reports_failure(self):
        with contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(contributions.main(['--repo', str(self.root), '--base', self.base]), 1)

    def bootstrap_fixture(self):
        checker = 'codebase-integrity/domaines/construction-livraison/scripts/check_contributions.py'
        (self.root / checker).unlink()
        (self.root / self.demand).unlink()
        (self.root / self.card).unlink()
        base = self.commit('historique sans vérificateur')
        self.corrective()
        self.write(checker, (SCRIPTS / 'check_contributions.py').read_text())
        self.manifest['corrections'][0]['chemins'].append(checker)
        self.metadata()
        return base, self.commit()

    def test_bootstrap_approved_content_runs_all_contribution_checks(self):
        base, approved = self.bootstrap_fixture()
        with patch.object(trusted, 'BOOTSTRAP_BASE', base):
            self.assertEqual(trusted.run(self.root, base, approved, approved).returncode, 0)

    def test_bootstrap_missing_or_symbolic_approval_is_refused(self):
        base, approved = self.bootstrap_fixture()
        with patch.object(trusted, 'BOOTSTRAP_BASE', base):
            for approval in (None, 'HEAD', approved[:7], '0' * 40):
                with self.subTest(approval=approval), self.assertRaises(
                        (ValueError, subprocess.CalledProcessError)):
                    trusted.run(self.root, base, approved, approval)

    def test_bootstrap_rejects_content_changed_after_approval(self):
        base, approved = self.bootstrap_fixture()
        self.write('codebase-integrity/domaines/construction-livraison/scripts/check_contributions.py', 'raise SystemExit(0)')
        head = self.commit()
        with patch.object(trusted, 'BOOTSTRAP_BASE', base), self.assertRaisesRegex(ValueError, 'différent'):
            trusted.run(self.root, base, head, approved)

    def test_bootstrap_accepts_rewritten_commit_with_identical_tree(self):
        base, approved = self.bootstrap_fixture()
        rewritten = self.commit()
        self.assertNotEqual(rewritten, approved)
        with patch.object(trusted, 'BOOTSTRAP_BASE', base):
            self.assertEqual(trusted.run(self.root, base, rewritten, approved).returncode, 0)

    def test_bootstrap_refuses_another_initial_base(self):
        base, approved = self.bootstrap_fixture()
        with patch.object(trusted, 'BOOTSTRAP_BASE', '0' * 40), self.assertRaisesRegex(ValueError, 'base initiale'):
            trusted.run(self.root, base, approved, approved)

    def test_bootstrap_does_not_replace_normal_base_policy(self):
        self.write('code.py', 'candidate')
        head = self.commit()
        self.assertEqual(trusted.run(self.root, self.base, head, 'HEAD').returncode, 0)

    def test_bootstrap_invalid_declaration_still_fails(self):
        base, _ = self.bootstrap_fixture()
        self.manifest['corrections'][0]['controles'] = ['absent.py']
        self.metadata()
        approved = self.commit()
        with patch.object(trusted, 'BOOTSTRAP_BASE', base), self.assertRaises(subprocess.CalledProcessError):
            trusted.run(self.root, base, approved, approved)

    def test_bootstrap_rejects_another_otherwise_valid_demand(self):
        base, _ = self.bootstrap_fixture()
        self.git('checkout', '-q', '--detach', base)
        self.demand = 'dev-book/demand/DEM-029-fixture.md'
        self.corrective()
        checker = 'codebase-integrity/domaines/construction-livraison/scripts/check_contributions.py'
        self.write(checker, (SCRIPTS / 'check_contributions.py').read_text())
        self.manifest['corrections'][0]['chemins'].append(checker)
        self.metadata()
        self.write(self.card, '# Carte\n\n- Demande : DEM-029\n\n## Mission\n')
        approved = self.commit('feat(OPS-079): modifier le contrat\n\nDemande : DEM-029')
        self.assertEqual(contributions.check(self.root, base, approved), 1)
        with patch.object(trusted, 'BOOTSTRAP_BASE', base), self.assertRaises(subprocess.CalledProcessError):
            trusted.run(self.root, base, approved, approved)

    def test_bootstrap_approval_is_cli_only_and_explicit(self):
        base, approved = self.bootstrap_fixture()
        with patch.object(trusted, 'BOOTSTRAP_BASE', base):
            with contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(trusted.main(['--repo', str(self.root), '--base', base,
                                              '--head', approved]), 1)
            self.assertEqual(trusted.main(['--repo', str(self.root), '--base', base,
                                          '--head', approved, '--bootstrap-policy-sha', approved]), 0)



if __name__ == '__main__':
    unittest.main()
