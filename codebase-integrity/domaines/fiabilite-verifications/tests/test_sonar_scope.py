import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
SPEC = importlib.util.spec_from_file_location("sonar_scope", ROOT / "webapp/scripts/quality/sonar_scope.py")
scope = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(scope)


class ScopeTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)

    def add(self, name, content="x", tracked=True):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        if tracked:
            subprocess.run(["git", "add", "--", name], cwd=self.root, check=True)
        return path

    def test_selects_tracked_sources_only(self):
        allowed = ["webapp/sites/showcase-immobilier/app/index.vue", "webapp/base/real-estate/a.vue", "webapp/server/api/x.ts", "webapp/services/x.ts", "webapp/shared/x.ts", "webapp/nuxt.config.ts", "webapp/sites/showcase-immobilier/app/a.css"]
        for name in allowed:
            self.add(name)
        for name in ["webapp/server/a.vitest.ts", "webapp/server/tests/a.ts", "webapp/sites/client2-immobilier/app/a.vue", "webapp/sites/showcase-immobilier/content/a.ts", "webapp/server/node_modules/a.ts"]:
            self.add(name)
        self.add("webapp/services/untracked.ts", tracked=False)
        self.assertEqual([item["path"] for item in scope.select(self.root)], sorted(allowed))

    def test_refuses_empty_and_changed(self):
        with self.assertRaisesRegex(ValueError, "vide"):
            scope.select(self.root)
        path = self.add("webapp/server/x.ts")
        manifest = scope.select(self.root)
        path.write_text("changed")
        with tempfile.TemporaryDirectory() as target, self.assertRaisesRegex(ValueError, "modifié"):
            scope.copy_selection(self.root, Path(target), manifest)

    def test_refuses_symlink_and_missing_file(self):
        path = self.add("webapp/server/x.ts")
        manifest = scope.select(self.root)
        path.unlink()
        with self.assertRaises(OSError):
            scope.select(self.root)
        path.symlink_to("/etc/passwd")
        with self.assertRaises(OSError):
            scope.select(self.root)
        with tempfile.TemporaryDirectory() as target, self.assertRaises(OSError):
            scope.copy_selection(self.root, Path(target), manifest)

    def test_rejects_forged_path(self):
        with tempfile.TemporaryDirectory() as target, self.assertRaises(ValueError):
            scope.copy_selection(self.root, Path(target), [{"path": "../secret", "sha256": "x"}])


if __name__ == "__main__":
    unittest.main()
