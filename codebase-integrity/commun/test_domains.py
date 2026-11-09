"""Exécuter les tests Python de tous les domaines sans imposer de packages ou README locaux."""
from pathlib import Path
import unittest

root = Path(__file__).resolve().parents[1]
suite = unittest.TestSuite()
for directory in sorted((root / 'domaines').glob('*/tests')):
    suite.addTests(unittest.defaultTestLoader.discover(str(directory), pattern='test_*.py', top_level_dir=str(directory)))
raise SystemExit(0 if unittest.TextTestRunner(verbosity=1).run(suite).wasSuccessful() else 1)
