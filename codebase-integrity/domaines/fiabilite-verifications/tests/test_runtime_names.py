import importlib.util
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/check_runtime_names.py'
spec = importlib.util.spec_from_file_location('check_runtime_names', SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RuntimeNamesTests(unittest.TestCase):
    def test_active_names_and_historical_exclusion(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in module.FILES:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('\n'.join(module.CURRENT))
            history = root / 'dev-book/tasks/history.md'
            history.parent.mkdir(parents=True)
            history.write_text('test-browser')
            self.assertEqual(module.inspect(root), [])
            path = root / module.FILES[0]
            path.write_text(path.read_text() + '\ntest-browser\n')
            self.assertTrue(any('test-browser' in error for error in module.inspect(root)))
            path.write_text('\n'.join(module.CURRENT[1:]))
            self.assertTrue(any('runtime-tests-browser' in error for error in module.inspect(root)))
            path.unlink()
            self.assertTrue(any('absent' in error for error in module.inspect(root)))


if __name__ == '__main__':
    unittest.main()
