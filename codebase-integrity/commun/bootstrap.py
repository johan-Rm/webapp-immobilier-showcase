"""Chemins partagés par les outils et leurs tests ; aucune écriture ni dépendance applicative."""
from pathlib import Path
import sys

FILE = Path(__file__).resolve()
FLAT_POLICY = (FILE.parent / 'check_contributions.py').is_file()
REPO_ROOT = FILE.parent if FLAT_POLICY else next((parent for parent in FILE.parents if (parent / 'codebase-integrity').is_dir()), Path.cwd())

def configure_imports():
    if FLAT_POLICY:
        return
    for path in sorted((REPO_ROOT / 'codebase-integrity/domaines').glob('*/scripts')):
        if path.is_dir():
            sys.path.insert(0, str(path))
