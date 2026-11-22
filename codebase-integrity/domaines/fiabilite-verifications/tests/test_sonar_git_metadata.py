"""Expérience locale sur les métadonnées Git filtrées, sans scanner ni réseau."""

from pathlib import Path
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "webapp/scripts/quality"))
from sonar_git_preview import build_filtered_git


def git(repo, *args, data=None, check=True):
    return subprocess.run(
        ["git", "-C", str(repo), *args], input=data, stdout=subprocess.PIPE,
        stderr=subprocess.PIPE, check=check,
    )


class FilteredGitExperiment(unittest.TestCase):
    def test_refuses_invalid_selection_revision_and_destination(self):
        with tempfile.TemporaryDirectory(prefix="sonar-metadata-test-") as directory:
            root = Path(directory)
            empty = root / "empty"
            empty.mkdir()
            revision = "a" * 40
            for head, files in [("HEAD", ["webapp/server/a.ts"]), (revision, []),
                                (revision, ["webapp/server/../../private.ts"])]:
                with self.subTest(head=head, files=files), self.assertRaises(ValueError):
                    build_filtered_git(root, empty, head, revision, files)
            (empty / "keep").write_text("preserve")
            with self.assertRaises(ValueError):
                build_filtered_git(root, empty, revision, revision, ["webapp/server/a.ts"])
            self.assertEqual((empty / "keep").read_text(), "preserve")

    def test_commits_diff_and_blame_without_private_blobs(self):
        with tempfile.TemporaryDirectory(prefix="sonar-metadata-test-") as directory:
            source, filtered = (Path(directory) / name for name in ("source", "filtered"))
            source.mkdir()
            filtered.mkdir()
            git(source, "init", "-q")
            git(source, "config", "user.name", "Synthetic User")
            git(source, "config", "user.email", "synthetic@example.invalid")
            (source / "webapp/server/api").mkdir(parents=True)
            (source / "webapp/server/api/app.ts").write_text("const one = 1\n")
            (source / "webapp/server/api/excluded.txt").write_text("synthetic private old\n")
            git(source, "add", ".")
            git(source, "commit", "-qm", "base")
            base = git(source, "rev-parse", "HEAD").stdout.strip().decode()
            (source / "webapp/server/api/app.ts").write_text("const one = 1\nconst two = 2\n")
            (source / "webapp/server/api/excluded.txt").write_text("synthetic private new\n")
            git(source, "add", ".")
            git(source, "commit", "-qm", "head")
            head = git(source, "rev-parse", "HEAD").stdout.strip().decode()
            build_filtered_git(source, filtered, head, base, ["webapp/server/api/app.ts"])
            for revision in (base, head):
                blob = git(source, "rev-parse", f"{revision}:webapp/server/api/app.ts").stdout.strip().decode()
                self.assertEqual(git(filtered, "cat-file", "blob", blob).returncode, 0)
                private = git(source, "rev-parse", f"{revision}:webapp/server/api/excluded.txt").stdout.strip().decode()
                self.assertNotEqual(git(filtered, "cat-file", "-e", private, check=False).returncode, 0)
            self.assertEqual(git(filtered, "merge-base", "origin/base", "head").stdout.strip().decode(), base)
            self.assertEqual(git(filtered, "diff", "--unified=0", base, head, "--", "webapp/server/api/app.ts").stdout,
                             git(source, "diff", "--unified=0", base, head, "--", "webapp/server/api/app.ts").stdout)
            self.assertEqual(git(filtered, "blame", "--line-porcelain", head, "--", "webapp/server/api/app.ts").stdout,
                             git(source, "blame", "--line-porcelain", head, "--", "webapp/server/api/app.ts").stdout)
            self.assertIn(b"excluded.txt", git(filtered, "ls-tree", "-r", head).stdout)
            self.assertIn(b"Synthetic User", git(filtered, "cat-file", "commit", head).stdout)
            if shutil.which("bwrap"):
                isolated = subprocess.run([
                    "bwrap", "--unshare-user", "--unshare-pid", "--ro-bind", "/usr", "/usr",
                    "--symlink", "usr/bin", "/bin", "--symlink", "usr/lib", "/lib",
                    "--symlink", "usr/lib64", "/lib64", "--proc", "/proc", "--dev", "/dev",
                    "--ro-bind", str(filtered), "/project", "--chdir", "/project", "/bin/sh", "-c",
                    'git cat-file -e "$1" && ! git cat-file -e "$2" 2>/dev/null && test ! -e /home/johan',
                    "sh", head, private,
                ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, env={"PATH": "/usr/bin:/bin", "HOME": "/nonexistent", "GIT_CONFIG_NOSYSTEM": "1"})
                self.assertEqual(isolated.returncode, 0, os.fsdecode(isolated.stderr))


if __name__ == "__main__":
    unittest.main()
