"""Construct a filtered Git object store for offline experiments only."""

import re
import subprocess
from pathlib import Path

from sonar_scope import eligible


def git(root: Path, *args: str, data: bytes | None = None) -> bytes:
    return subprocess.run(
        ["git", "-C", str(root), "--literal-pathspecs", *args], input=data, stdout=subprocess.PIPE,
        stderr=subprocess.PIPE, check=True, timeout=45,
    ).stdout


def build_filtered_git(source: Path, target: Path, head: str, base: str, files: list[str],
                       head_branch: str = "head", base_branch: str = "base") -> None:
    """Keep original commit/tree objects and only blobs for approved paths.

    This does not establish SonarScanner compatibility or permission to transmit
    metadata. The caller owns the empty temporary destination and its cleanup.
    """
    if not all(re.fullmatch(r"[0-9a-f]{40}", value) for value in (head, base)):
        raise ValueError("révisions Git invalides")
    if not files or any(not eligible(path) for path in files):
        raise ValueError("sélection vide ou chemin interdit")
    if not all(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._/-]*", name) for name in (head_branch, base_branch)):
        raise ValueError("branche Git invalide")
    if not target.is_dir() or any(target.iterdir()):
        raise ValueError("destination temporaire non vide")
    pack = git(source, "pack-objects", "--stdout", "--revs", "--filter=blob:none", data=f"{head}\n{base}\n".encode())
    git(target, "init", "-q")
    git(target, "index-pack", "--stdin", data=pack)
    git(source, "merge-base", head, base)
    git(target, "update-ref", f"refs/remotes/origin/{base_branch}", base)
    git(target, "update-ref", f"refs/heads/{head_branch}", head)
    git(target, "symbolic-ref", "HEAD", f"refs/heads/{head_branch}")
    git(target, "read-tree", head)
    objects = git(source, "rev-list", "--objects", "--no-object-names", head, base, "--", *sorted(set(files)))
    info = git(source, "cat-file", "--batch-check=%(objectname) %(objecttype)", data=objects)
    for line in info.splitlines():
        object_id, kind = line.split(b" ", 1)
        if kind == b"blob":
            content = git(source, "cat-file", "blob", object_id.decode())
            stored = git(target, "hash-object", "-w", "--stdin", data=content).strip()
            if stored != object_id:
                raise ValueError("empreinte Git incohérente")
