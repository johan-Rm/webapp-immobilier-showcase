#!/usr/bin/env python3
"""Run a separately provisioned scanner against a filtered, confined snapshot."""

import argparse
import base64
import hashlib
from contextlib import nullcontext
import os
from pathlib import Path
import re
import secrets
import shutil
import stat
import subprocess
import sys
import tempfile
from urllib.parse import quote

from sonar_scope import ROOT, copy_selection, select
from sonar_git_preview import build_filtered_git, git
from sonar_egress import start_relay


SONAR_IDENTIFIER = re.compile(r"[A-Za-z0-9_.:/-]+")
SONAR_SETTINGS = ("SONAR_ORGANIZATION", "SONAR_PROJECT_KEY", "SONAR_TOKEN")


def create_log(root: Path) -> tuple[int, Path]:
    directory = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        for name in ("webapp", ".tmp", "sonarqube"):
            if name != "webapp":
                try:
                    os.mkdir(name, 0o700, dir_fd=directory)
                except FileExistsError:
                    pass
            child = os.open(name, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=directory)
            os.close(directory)
            directory = child
        name = f"sonar-{secrets.token_hex(12)}.log"
        descriptor = os.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=directory)
        return descriptor, root / "webapp" / ".tmp" / "sonarqube" / name
    finally:
        os.close(directory)


def run_logged(command: list[str], env: dict[str, str], root: Path, token: str) -> tuple[int, Path]:
    descriptor, log_path = create_log(root)
    with os.fdopen(descriptor, "wb") as log:
        process = subprocess.Popen(command, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        output = bytearray()
        truncated = False
        assert process.stdout is not None
        while chunk := process.stdout.read(65536):
            remaining = max(0, 4 * 1024 * 1024 - len(output))
            output.extend(chunk[:remaining])
            truncated = truncated or len(chunk) > remaining
        process.stdout.close()
        result = process.wait()
        sanitized = bytes(output)
        for secret in {token.encode(), quote(token, safe="").encode(), base64.b64encode(token.encode())}:
            if secret:
                sanitized = sanitized.replace(secret, b"[masque]")
        log.write(sanitized)
        if truncated:
            log.write(b"\n[journal tronque a 4 Mio]\n")
        return result, log_path


def has_report(work: Path) -> bool:
    try:
        directory = os.open(work, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            scanner = os.open("scanner", os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=directory)
            try:
                descriptor = os.open("report-task.txt", os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=scanner)
                with os.fdopen(descriptor, "rb") as report:
                    return stat.S_ISREG(os.fstat(report.fileno()).st_mode) and bool(
                        re.search(rb"(?m)^ceTaskId=\S+", report.read(65536))
                    )
            finally:
                os.close(scanner)
        finally:
            os.close(directory)
    except OSError:
        return False


def run(root: Path, scanner: Path, token: str, organization: str, project: str, branch: str,
        pull_request: dict[str, str] | None = None, use_relay: bool = False) -> str:
    if not token:
        return "Analyse SonarQube non réalisée : token absent."
    if not all(SONAR_IDENTIFIER.fullmatch(value or "") for value in (organization, project, branch)):
        return "Analyse SonarQube non réalisée : configuration absente ou invalide."
    bwrap = shutil.which("bwrap")
    if not bwrap or (use_relay and not shutil.which("socat")) or not scanner.is_dir() or not (scanner / "bin/sonar-scanner").is_file():
        return "Analyse SonarQube non réalisée : scanner ou confinement absent."
    scanner = scanner.resolve()
    if scanner == root.resolve() or root.resolve() in scanner.parents or scanner in root.resolve().parents:
        return "Analyse SonarQube non réalisée : installation du scanner dans le dépôt ou un dossier parent."
    with tempfile.TemporaryDirectory(prefix="sonar-isolated-") as temporary:
        temp = Path(temporary)
        snapshot, work, home = (temp / part for part in ("snapshot", "work", "home"))
        for path in (snapshot, work, home):
            path.mkdir(mode=0o700)
        manifest = select(root)
        copy_selection(root, snapshot, manifest)
        filtered_git = None
        if pull_request:
            if not re.fullmatch(r"[1-9][0-9]*", pull_request["key"]):
                raise ValueError("identifiant PR invalide")
            if git(root, "rev-parse", "HEAD").decode().strip() != pull_request["head"]:
                raise ValueError("HEAD différent de la PR")
            files = [entry["path"] for entry in manifest]
            for entry in manifest:
                committed = git(root, "show", f"{pull_request['head']}:{entry['path']}")
                if hashlib.sha256(committed).hexdigest() != entry["sha256"]:
                    raise ValueError("copie différente du commit PR")
            filtered_git = temp / "filtered-git"
            filtered_git.mkdir(mode=0o700)
            build_filtered_git(root, filtered_git, pull_request["head"], pull_request["base"], files,
                               pull_request["branch"], pull_request["base_branch"])
            (snapshot / ".git").mkdir()
        command = [
            bwrap, "--die-with-parent", "--unshare-user", "--unshare-pid", "--unshare-ipc", "--unshare-uts", "--unshare-net",
            "--ro-bind", "/usr", "/usr", "--symlink", "usr/bin", "/bin", "--symlink", "usr/lib", "/lib",
            "--symlink", "usr/lib64", "/lib64", "--proc", "/proc", "--dev", "/dev",
            "--ro-bind", str(scanner), "/opt/sonar", "--ro-bind", str(snapshot), "/project",
            "--bind", str(work), "/work", "--bind", str(home), "/home/scanner",
            "--tmpfs", "/tmp", "--chdir", "/project",
        ]
        for path in ("/etc/ssl/certs", "/etc/resolv.conf", "/etc/hosts", "/etc/nsswitch.conf"):
            if Path(path).exists():
                command += ["--ro-bind", path, path]
        if filtered_git:
            command += ["--ro-bind", str(filtered_git / ".git"), "/project/.git"]
        proxy_socket = temp / "relay.sock"
        if use_relay:
            command += ["--dir", "/run", "--ro-bind", str(proxy_socket), "/run/sonar-egress.sock"]
        scanner_command = [
            "/opt/sonar/bin/sonar-scanner", "-Dsonar.projectBaseDir=/project", "-Dsonar.sources=.",
            "-Dsonar.working.directory=/work/scanner", "-Dsonar.host.url=https://sonarcloud.io",
            "-Dsonar.sca.enabled=false", "-Dsonar.exclusions=**/.git/**",
            f"-Dsonar.organization={organization}", f"-Dsonar.projectKey={project}",
        ]
        if pull_request:
            scanner_command += [f"-Dsonar.pullrequest.key={pull_request['key']}",
                        f"-Dsonar.pullrequest.branch={pull_request['branch']}",
                        f"-Dsonar.pullrequest.base={pull_request['base_branch']}"]
        else:
            scanner_command += ["-Dsonar.scm.disabled=true", f"-Dsonar.branch.name={branch}"]
        env = {"PATH": "/usr/bin:/bin", "HOME": "/home/scanner", "SONAR_USER_HOME": "/home/scanner/.sonar", "SONAR_TOKEN": token}
        if use_relay:
            env.update({"HTTPS_PROXY": "http://127.0.0.1:18080", "HTTP_PROXY": "http://127.0.0.1:18080",
                        "JAVA_TOOL_OPTIONS": "-Dhttps.proxyHost=127.0.0.1 -Dhttps.proxyPort=18080"})
            scanner_command += ["-Dsonar.scanner.proxyHost=127.0.0.1", "-Dsonar.scanner.proxyPort=18080"]
            launcher = ('socat TCP4-LISTEN:18080,bind=127.0.0.1,reuseaddr,fork UNIX-CONNECT:/run/sonar-egress.sock & '
                        'relay=$!; trap "kill $relay 2>/dev/null" EXIT; sleep 1; kill -0 "$relay" || exit 1; "$@"')
            command += ["/bin/sh", "-c", launcher, "sonar-relay", *scanner_command]
        else:
            command += scanner_command
        with start_relay(proxy_socket) if use_relay else nullcontext():
            result, log_path = run_logged(command, env, root, token)
        if result or not has_report(work):
            return f"Analyse SonarQube non réalisée : échec technique ou rapport absent. Journal privé : {log_path}"
        return f"Analyse SonarQube soumise ; traitement et résultat distants non vérifiés. Journal privé : {log_path}"


def scanner_settings(root: Path, environment: dict[str, str]) -> dict[str, str]:
    settings = {name: environment.get(name, "") for name in SONAR_SETTINGS}
    if environment.get("GITHUB_EVENT_NAME") or all(settings.values()):
        return settings

    try:
        lines = (root / "webapp/.env").read_text(encoding="utf-8").splitlines()
    except FileNotFoundError:
        return settings

    local = {}
    for line in lines:
        key, separator, value = line.partition("=")
        key = key.strip()
        if separator and key in settings:
            local[key] = value.strip().strip("\"'")
    return {name: value or local.get(name, "") for name, value in settings.items()}


def scanner_branch(root: Path, environment: dict[str, str], pull_request: dict[str, str] | None) -> str:
    if pull_request:
        return pull_request["branch"]
    explicit = environment.get("SONAR_BRANCH", "")
    if explicit:
        return explicit
    event = environment.get("GITHUB_EVENT_NAME")
    if event:
        return environment.get("GITHUB_REF_NAME", "") if event == "push" else ""
    branch = subprocess.run(
        ["git", "symbolic-ref", "--quiet", "--short", "HEAD"],
        cwd=root, capture_output=True, text=True, check=False,
    )
    return branch.stdout.strip() if branch.returncode == 0 else ""


def main(check_config: bool = False) -> int:
    try:
        settings = scanner_settings(ROOT, os.environ)
        missing = [name for name, value in settings.items() if not value]
        if missing:
            source = "la configuration GitHub" if os.environ.get("GITHUB_EVENT_NAME") else "webapp/.env"
            print(f"Analyse SonarQube non réalisée : renseigner {', '.join(missing)} dans {source}.")
            return 1
        event = os.environ.get("GITHUB_EVENT_NAME", "")
        pull_request = None
        if event == "pull_request":
            pull_request = {key: os.environ.get(name, "") for key, name in {
                "key": "SONAR_PR_KEY", "head": "SONAR_PR_HEAD_SHA", "base": "SONAR_PR_BASE_SHA",
                "branch": "SONAR_PR_BRANCH", "base_branch": "SONAR_PR_BASE_BRANCH",
            }.items()}
        branch = scanner_branch(ROOT, os.environ, pull_request)
        if not branch:
            print("Analyse SonarQube non réalisée : branche Git introuvable. Ouvrir une branche ou renseigner SONAR_BRANCH.")
            return 1
        organization = settings["SONAR_ORGANIZATION"]
        project = settings["SONAR_PROJECT_KEY"]
        if check_config:
            if not all(SONAR_IDENTIFIER.fullmatch(value or "") for value in (organization, project, branch)):
                print("Analyse SonarQube non réalisée : organisation, projet ou branche invalide.")
                return 1
            return 0
        scanner = Path(os.environ.get("SONAR_SCANNER_HOME", "/nonexistent"))
        result = run(ROOT, scanner, settings["SONAR_TOKEN"], organization, project, branch, pull_request, use_relay=True)
        print(result)
        return 0 if result.startswith("Analyse SonarQube soumise") else 1
    except (OSError, ValueError, KeyError, subprocess.SubprocessError):
        print("Analyse SonarQube non réalisée : préparation ou confinement impossible.")
    return 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-config", action="store_true", help="Vérifier les paramètres sans lancer le scanner")
    sys.exit(main(parser.parse_args().check_config))
