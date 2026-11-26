import importlib.util
import contextlib
import io
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "webapp/scripts/quality"))
SPEC = importlib.util.spec_from_file_location("sonar_run", ROOT / "webapp/scripts/quality/sonar_run.py")
runner = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(runner)


def isolated_network_available():
    if not shutil.which("bwrap"):
        return False
    probe = subprocess.run([
        "bwrap", "--unshare-user", "--unshare-net", "--ro-bind", "/usr", "/usr",
        "--symlink", "usr/bin", "/bin", "--symlink", "usr/lib", "/lib",
        "--symlink", "usr/lib64", "/lib64", "--", "/bin/true",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    return probe.returncode == 0


class LocalConfiguration(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        (self.root / "webapp").mkdir()
        self.env_file = self.root / "webapp/.env"
        self.env_file.write_text(
            'SONAR_ORGANIZATION=local-org\nSONAR_PROJECT_KEY="local-project"\n'
            "SONAR_TOKEN='synthetic-token'\nOTHER_SETTING=ignored\n"
        )

    def test_loads_local_settings_with_explicit_environment_priority(self):
        self.assertEqual(runner.scanner_settings(self.root, {"SONAR_PROJECT_KEY": "override"}), {
            "SONAR_ORGANIZATION": "local-org",
            "SONAR_PROJECT_KEY": "override",
            "SONAR_TOKEN": "synthetic-token",
        })

    def test_ci_uses_only_explicit_configuration_and_its_git_ref(self):
        environment = {"GITHUB_EVENT_NAME": "push", "GITHUB_REF_NAME": "develop", "SONAR_TOKEN": "ci-token"}
        self.assertEqual(runner.scanner_settings(self.root, environment), {
            "SONAR_ORGANIZATION": "", "SONAR_PROJECT_KEY": "", "SONAR_TOKEN": "ci-token",
        })
        self.assertEqual(runner.scanner_branch(self.root, environment, None), "develop")
        self.assertEqual(runner.scanner_branch(self.root, environment, {"branch": "feature"}), "feature")

    def test_local_launcher_detects_current_branch_and_preflights_without_scanner(self):
        branch = "demands/DEM-017-analyse-sonarqube"
        subprocess.run(["git", "init", "-q", "-b", branch], cwd=self.root, check=True)
        with patch.dict(os.environ, {}, clear=True), patch.object(runner, "ROOT", self.root), \
             patch.object(runner, "run", return_value="Analyse SonarQube soumise") as scan, \
             contextlib.redirect_stdout(io.StringIO()) as output:
            self.assertEqual(runner.main(check_config=True), 0)
            scan.assert_not_called()
            self.assertEqual(runner.main(), 0)
            self.assertEqual(scan.call_args.args[2:6], ("synthetic-token", "local-org", "local-project", branch))
            self.assertNotIn("synthetic-token", output.getvalue())

    def test_missing_local_settings_fail_preflight_without_printing_values(self):
        self.env_file.write_text("SONAR_TOKEN=synthetic-token\n")
        with patch.dict(os.environ, {}, clear=True), patch.object(runner, "ROOT", self.root), \
             patch.object(runner, "run") as scan, contextlib.redirect_stdout(io.StringIO()) as output:
            self.assertEqual(runner.main(check_config=True), 1)
        scan.assert_not_called()
        self.assertIn("SONAR_ORGANIZATION, SONAR_PROJECT_KEY", output.getvalue())
        self.assertNotIn("synthetic-token", output.getvalue())


class MakeEntryPoint(unittest.TestCase):
    def test_provisions_only_local_scans_without_an_installed_scanner(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(["git", "init", "-q"], cwd=root, check=True)
            scripts = root / "webapp/scripts/quality"
            scripts.mkdir(parents=True)
            (scripts / "manual_sonar_cloud.sh").write_text('printf "%s\\n" "local provisioning"\n')
            (scripts / "sonar_run.py").write_text('print("direct scanner")\n')
            environment = {
                key: value for key, value in os.environ.items()
                if key not in {"GITHUB_EVENT_NAME", "SONAR_SCANNER_HOME", "MAKEFLAGS"}
            }
            for overrides, expected in (
                ({}, "local provisioning"),
                ({"SONAR_SCANNER_HOME": "/scanner"}, "direct scanner"),
                ({"GITHUB_EVENT_NAME": "pull_request"}, "direct scanner"),
            ):
                with self.subTest(overrides=overrides):
                    output = subprocess.check_output(
                        ["make", "--no-print-directory", "-f", str(ROOT / "infra/make/Makefile.dev"),
                         "third-party-tests-sonar"],
                        cwd=root, env={**environment, **overrides}, text=True, timeout=5,
                    )
                    self.assertEqual(output.strip(), expected)


class IsolatedScan(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / "repo"
        self.root.mkdir()
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        source = self.root / "webapp/server/api/example.ts"
        source.parent.mkdir(parents=True)
        source.write_text("export const x = 1")
        subprocess.run(["git", "add", "webapp/server/api/example.ts"], cwd=self.root, check=True)
        self.scanner = Path(self.tmp.name) / "scanner"
        (self.scanner / "bin").mkdir(parents=True)

    def fake_scanner(self, body):
        executable = self.scanner / "bin/sonar-scanner"
        executable.write_text("#!/bin/sh\n" + body + "\n")
        executable.chmod(0o755)

    def test_missing_token_and_bad_configuration(self):
        self.assertIn("token absent", runner.run(self.root, self.scanner, "", "org", "project", "develop"))
        self.assertIn("configuration", runner.run(self.root, self.scanner, "secret", "bad value", "project", "develop"))

    @unittest.skipUnless(isolated_network_available(), "isolation réseau indisponible")
    def test_confined_fake_scanner_and_report(self):
        self.fake_scanner('test -f /project/webapp/server/api/example.ts || exit 2\n'
                          'test ! -e /home/johan && test ! -e /project/.git || exit 3\n'
                          'mkdir -p /work/scanner && echo ceTaskId=fake > /work/scanner/report-task.txt')
        result = runner.run(self.root, self.scanner, "fake-token", "org", "project", "develop")
        self.assertIn("soumise", result)

    @unittest.skipUnless(isolated_network_available(), "isolation réseau indisponible")
    def test_no_report_does_not_claim_success(self):
        self.fake_scanner("exit 0")
        self.assertIn("rapport absent", runner.run(self.root, self.scanner, "fake-token", "org", "project", "develop"))

    @unittest.skipUnless(isolated_network_available(), "isolation réseau indisponible")
    def test_symlink_report_does_not_claim_success(self):
        self.fake_scanner("mkdir -p /work/scanner; ln -s /etc/passwd /work/scanner/report-task.txt")
        self.assertIn("rapport absent", runner.run(self.root, self.scanner, "fake-token", "org", "project", "develop"))

    def test_pull_request_never_starts_scanner(self):
        output = io.StringIO()
        with patch.dict(os.environ, {"GITHUB_EVENT_NAME": "pull_request", "SONAR_TOKEN": "secret"}, clear=True), \
             patch.object(runner, "ROOT", self.root), \
             contextlib.redirect_stdout(output):
            self.assertEqual(runner.main(), 1)
        self.assertIn("non réalisée", output.getvalue())
        self.assertNotIn("secret", output.getvalue())

    @unittest.skipUnless(isolated_network_available(), "isolation réseau indisponible")
    def test_pull_request_uses_filtered_git_without_private_blob(self):
        subprocess.run(["git", "config", "user.name", "Synthetic"], cwd=self.root, check=True)
        subprocess.run(["git", "config", "user.email", "synthetic@example.invalid"], cwd=self.root, check=True)
        private = self.root / "private.txt"
        private.write_text("synthetic private")
        subprocess.run(["git", "add", "."], cwd=self.root, check=True)
        subprocess.run(["git", "commit", "-qm", "base"], cwd=self.root, check=True)
        base = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=self.root, text=True).strip()
        blob = subprocess.check_output(["git", "rev-parse", "HEAD:private.txt"], cwd=self.root, text=True).strip()
        (self.root / "webapp/server/api/example.ts").write_text("export const x = 2")
        subprocess.run(["git", "add", "."], cwd=self.root, check=True)
        subprocess.run(["git", "commit", "-qm", "head"], cwd=self.root, check=True)
        head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=self.root, text=True).strip()
        self.fake_scanner(f'git -C /project cat-file -e {head} || exit 2\n'
                          f'! git -C /project cat-file -e {blob} 2>/dev/null || exit 3\n'
                          'test ! -e /home/johan || exit 4\n'
                          'mkdir -p /work/scanner && echo ceTaskId=fake > /work/scanner/report-task.txt')
        pr = {"key": "1", "head": head, "base": base, "branch": "feature", "base_branch": "develop"}
        result = runner.run(self.root, self.scanner, "fake-token", "org", "project", "feature", pr)
        self.assertIn("soumise", result)
        (self.root / "webapp/server/api/example.ts").write_text("uncommitted change")
        with self.assertRaisesRegex(ValueError, "différente"):
            runner.run(self.root, self.scanner, "fake-token", "org", "project", "feature", pr)

    @unittest.skipUnless(isolated_network_available(), "isolation réseau indisponible")
    def test_failed_scanner_does_not_reveal_token(self):
        self.fake_scanner('echo "$SONAR_TOKEN"; echo "$SONAR_TOKEN" >&2; exit 1')
        result = runner.run(self.root, self.scanner, "fake-token", "org", "project", "develop")
        self.assertIn("échec", result)
        self.assertNotIn("fake-token", result)
        logs = list((self.root / "webapp/.tmp/sonarqube").glob("*.log"))
        self.assertEqual(len(logs), 1)
        self.assertNotIn("fake-token", logs[0].read_text())
        self.assertIn("[masque]", logs[0].read_text())
        self.assertEqual(logs[0].stat().st_mode & 0o777, 0o600)


if __name__ == "__main__":
    unittest.main()
