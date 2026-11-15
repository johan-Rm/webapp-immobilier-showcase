#!/usr/bin/env python3
"""Contrôler les cartes nouvelles ou modifiées depuis une base Git explicite."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[4]
CARD = re.compile(r'^dev-book/tasks/(?:OPS|WEB|BFF|DOM|DASH)-[0-9]+-[^/]+\.md$')
SESSION = r'[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}'


def git(root, *args):
    return subprocess.check_output(['git', *args], cwd=root, stderr=subprocess.PIPE)


def plain(text):
    text = re.sub(r'<!--.*?-->', '', text, flags=re.S)
    return re.sub(r'^ {0,3}(`{3,}|~{3,})[^\n]*\n.*?^ {0,3}\1\s*$', '', text, flags=re.M | re.S)


def card_errors(text, root):
    errors = []
    visible = plain(text)
    header = re.split(r'^##\s', visible, maxsplit=1, flags=re.M)[0]
    fields = {
        'session réelle': rf'Session de création\s*:\s*`?({SESSION})`?(?:\s|$)',
        'branche': r'Branche\s*:\s*`?(?:layers|demands)/[\w.-]+',
        'worktree': r'Worktree\s*:\s*`?(?:/[^\n`]+|worktree/[\w.-]+)',
        'dépendances': r'Dépendances[^:\n]*:\s*\S',
    }
    for name, pattern in fields.items():
        if not re.search(pattern, header, re.I | re.M):
            errors.append(f'métadonnée absente ou invalide : {name}')
    if not re.search(r'(?:Chemins autorisés|Périmètre(?: autorisé)?)\s*(?:\([^\n]*\))?\s*:\s*\S', visible, re.I):
        errors.append('périmètre autorisé explicite absent')
    sections = re.findall(r'^## Verdict humain\s*\n(.*?)(?=^## |\Z)', text, re.M | re.S)
    if len(sections) != 1:
        errors.append('section Verdict humain unique requise')
        return errors
    verdict = sections[0]
    blocks = re.findall(r'^```verdict-json\s*\n(.*?)^```\s*$', verdict, re.M | re.S)
    if not blocks:
        if not re.match(r'^\s*(?:Aucun(?:\b|\.)|<|En attente\b|À vérifier\b)', plain(verdict), re.I):
            errors.append('verdict non structuré : bloc verdict-json requis pour une décision')
        return errors
    if len(blocks) != 1:
        return errors + ['un seul bloc verdict-json attendu']
    try:
        record = json.loads(blocks[0])
        if not isinstance(record, dict) or record.get('decision') not in ('validé', 'ajusté', 'différé', 'rejeté'):
            raise ValueError('décision invalide')
        if not isinstance(record.get('portee'), str) or not record['portee'].strip():
            raise ValueError('portée du verdict absente')
        ref = record.get('contenu')
        if not isinstance(ref, dict):
            raise ValueError('référence du contenu absente')
        value = ref.get('valeur', '')
        if ref.get('type') == 'git':
            if not isinstance(value, str) or not re.fullmatch(r'[0-9a-f]{40}', value):
                raise ValueError('SHA Git complet requis')
            git(root, 'cat-file', '-e', value + '^{commit}')
        elif ref.get('type') == 'sha256':
            if not isinstance(value, str) or not re.fullmatch(r'[0-9a-f]{64}', value):
                raise ValueError('empreinte SHA-256 invalide')
            name = ref.get('fichier')
            if not isinstance(name, str) or not name:
                raise ValueError('fichier de preuve absent')
            relative = Path(name)
            if relative.is_absolute() or '..' in relative.parts:
                raise ValueError('preuve hors dépôt refusée')
            path = root / relative
            if any(p.is_symlink() for p in (path, *path.parents) if p.is_relative_to(root)):
                raise ValueError('preuve symbolique refusée')
            if hashlib.sha256(path.read_bytes()).hexdigest() != value:
                raise ValueError('empreinte différente du fichier de preuve')
        else:
            raise ValueError('type de référence attendu : git ou sha256')
    except (ValueError, OSError, subprocess.CalledProcessError) as exc:
        errors.append('verdict invalide : ' + str(exc))
    return errors


def check(root, base):
    if not re.fullmatch(r'[0-9a-f]{40}', base):
        raise ValueError('base requise : SHA Git complet de 40 caractères')
    git(root, 'cat-file', '-e', base + '^{commit}')
    tracked = git(root, 'ls-tree', '-r', '--name-only', '-z', base).decode().split('\0')
    removed = [name for name in tracked if CARD.fullmatch(name) and not (root / name).exists()]
    changed = git(root, 'diff', '--no-renames', '--name-only', '-z', base, '--', 'dev-book/tasks').decode().split('\0')
    untracked = git(root, 'ls-files', '--others', '--exclude-standard', '-z', '--', 'dev-book/tasks').decode().split('\0')
    names = sorted({n for n in changed + untracked if CARD.fullmatch(n)})
    errors = [f'{name} : suppression ou renommage de carte à arbitrer explicitement' for name in removed]
    count = 0
    for name in names:
        path = root / name
        if name in removed:
            continue
        count += 1
        try:
            if any(p.is_symlink() for p in (path, *path.parents) if p.is_relative_to(root)):
                raise ValueError('carte ou parent symbolique refusé')
            errors.extend(f'{name} : {error}' for error in card_errors(path.read_text(), root))
        except (OSError, ValueError) as exc:
            errors.append(f'{name} : {exc}')
    return errors, count


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', required=True)
    parser.add_argument('--repo', type=Path, default=ROOT)
    args = parser.parse_args(argv)
    try:
        errors, count = check(args.repo.resolve(), args.base)
    except (OSError, ValueError, subprocess.CalledProcessError) as exc:
        print(f'Contrôle des traces impossible : {exc}', file=sys.stderr)
        return 1
    print(f'{count} cartes nouvelles ou modifiées vérifiées ; {len(errors)} écart(s).')
    print('Portée : métadonnées, références des verdicts et suppressions ; adéquation des preuves et décision humaine non évaluées.')
    for error in errors:
        print(error, file=sys.stderr)
    return int(bool(errors))


if __name__ == '__main__':
    sys.exit(main())
