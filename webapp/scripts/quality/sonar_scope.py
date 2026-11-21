#!/usr/bin/env python3
"""Select tracked application files for an isolated Sonar preview."""

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[3]
ROOTS = (
    "webapp/sites/showcase-immobilier/app/",
    "webapp/base/real-estate/",
    "webapp/server/",
    "webapp/services/",
    "webapp/shared/",
)
CONFIGS = {
    "webapp/nuxt.config.ts",
    "webapp/sites/showcase-immobilier/nuxt.config.ts",
    "webapp/sites/showcase-immobilier/site.ts",
}
EXCLUDED_PARTS = {"tests", "test", "__tests__", "fixtures", "mocks", "node_modules", "generated", ".nuxt", ".output", ".tmp"}
TEST = re.compile(r"\.(?:test|spec|vitest|bun)\.[cm]?[jt]sx?$")


def eligible(path: str) -> bool:
    p = PurePosixPath(path)
    return (
        not p.is_absolute()
        and ".." not in p.parts
        and not EXCLUDED_PARTS.intersection(p.parts)
        and not TEST.search(path)
        and (path in CONFIGS or (any(path.startswith(root) for root in ROOTS) and p.suffix in {".ts", ".vue", ".css"}))
    )


def read_safe(root: Path, path: str) -> bytes:
    if not eligible(path):
        raise ValueError(f"chemin interdit : {path}")
    parts = PurePosixPath(path).parts
    directory = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        for part in parts[:-1]:
            child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=directory)
            os.close(directory)
            directory = child
        descriptor = os.open(parts[-1], os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=directory)
        with os.fdopen(descriptor, "rb") as source:
            if not stat.S_ISREG(os.fstat(source.fileno()).st_mode):
                raise ValueError(f"fichier ordinaire attendu : {path}")
            return source.read()
    finally:
        os.close(directory)


def select(root: Path) -> list[dict[str, str]]:
    result = subprocess.run(["git", "ls-files", "-z", "--cached", "--", "webapp"], cwd=root, check=True, stdout=subprocess.PIPE)
    names = sorted(set(os.fsdecode(p) for p in result.stdout.split(b"\0") if p))
    files = []
    for path in names:
        if eligible(path):
            content = read_safe(root, path)
            files.append({"path": path, "sha256": hashlib.sha256(content).hexdigest()})
    if not files:
        raise ValueError("sélection applicative vide")
    return files


def copy_selection(root: Path, destination: Path, manifest: list[dict[str, str]]) -> None:
    if not manifest:
        raise ValueError("sélection applicative vide")
    for item in manifest:
        path = item["path"]
        content = read_safe(root, path)
        if hashlib.sha256(content).hexdigest() != item["sha256"]:
            raise ValueError(f"fichier modifié après sélection : {path}")
        target = destination / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)


def main() -> int:
    try:
        manifest = select(ROOT)
        with tempfile.TemporaryDirectory(prefix="sonar-preview-") as temp:
            copy_selection(ROOT, Path(temp), manifest)
            print(json.dumps({"files": manifest, "analysis": "non réalisée"}, ensure_ascii=False, indent=2))
        return 0
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        print(f"Prévisualisation refusée : {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
