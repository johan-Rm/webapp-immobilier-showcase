#!/usr/bin/env python3
"""Contrôles documentaires locaux ; règles et limites dans docs/README.md."""
from pathlib import Path as _Path
import sys as _sys
_common = _Path(__file__).resolve().parent
if not (_common / 'bootstrap.py').is_file():
    _common = next((p / 'codebase-integrity/commun' for p in _Path(__file__).resolve().parents if (p / 'codebase-integrity/commun').is_dir()), _common)
_sys.path.insert(0, str(_common))
from bootstrap import REPO_ROOT, configure_imports
configure_imports()

from html import unescape
from html.parser import HTMLParser
from pathlib import Path
import os
import re
import subprocess
import sys
import unicodedata
from urllib.parse import unquote, urlsplit


class Elements(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.links = []
        self.ids = set()
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if value is None:
                continue
            if key == 'id' or (tag == 'a' and key == 'name'):
                self.ids.add(value)
            if key == 'href' or (tag in ('img', 'source') and key == 'src'):
                self.links.append(value)


def without_fences(text):
    lines = []
    fence = None
    for line in text.splitlines():
        marker = re.match(r'^ {0,3}(`{3,}|~{3,})(.*)$', line)
        if fence:
            if marker and marker[1][0] == fence[0] and len(marker[1]) >= len(fence) and not marker[2].strip():
                fence = None
            lines.append('')
        elif marker:
            fence = marker[1]
            lines.append('')
        else:
            lines.append(line)
    return '\n'.join(lines)


def without_code(text):
    return re.sub(r'(`+)([^`]|(?!\1)`)*?\1', '', without_fences(text))


def destination(raw):
    raw = raw.strip()
    if raw.startswith('<'):
        end = raw.find('>')
        if end < 0:
            raise ValueError('destination entre chevrons non fermée')
        return raw[1:end]
    # Une destination sans chevrons n'admet pas d'espaces non échappés.
    return re.split(r'(?<!\\)\s', raw, maxsplit=1)[0].replace('\\ ', ' ')


def links(text):
    """Liens en ligne équilibrés, références explicites et raccourcies, HTML."""
    text = without_code(text)
    definitions = {}
    result = []
    for line in text.splitlines():
        match = re.match(r'^ {0,3}\[([^\]]+)\]:\s*(.+)$', line)
        if match:
            definitions[' '.join(match[1].casefold().split())] = destination(match[2])
    text = re.sub(r'^ {0,3}\[[^\]]+\]:.*$', '', text, flags=re.M)
    pos = 0
    while True:
        start = text.find('](', pos)
        if start < 0:
            break
        i, depth, angle = start + 2, 1, False
        while i < len(text):
            char = text[i]
            if char == '\\':
                i += 2
                continue
            if char == '<':
                angle = True
            elif char == '>':
                angle = False
            elif not angle:
                if char == '(':
                    depth += 1
                elif char == ')':
                    depth -= 1
                    if depth == 0:
                        break
            i += 1
        if depth:
            raise ValueError('lien Markdown non fermé')
        result.append(destination(text[start + 2:i]))
        pos = i + 1
    for match in re.finditer(r'\[([^\]\n]+)\]\[([^\]\n]*)\]', text):
        label = ' '.join((match[2] or match[1]).casefold().split())
        if label not in definitions:
            raise ValueError(f'référence non définie : {label}')
        result.append(definitions[label])
    # Les références raccourcies sont des liens seulement si elles sont définies.
    for match in re.finditer(r'(?<!!)\[([^\]\n]+)\](?![\[(])', text):
        label = ' '.join(match[1].casefold().split())
        if label in definitions:
            result.append(definitions[label])
    result.extend(Elements(text).links)
    return result


def anchors(text, markdown=True):
    result = Elements(without_fences(text) if markdown else text).ids
    if not markdown:
        return result
    seen = set()
    for line in without_fences(text).splitlines():
        match = re.match(r'^ {0,3}#{1,6}\s+(.+?)(?:\s+#+\s*)?$', line)
        if not match:
            continue
        title = re.sub(r'!?\[([^\]]+)\]\([^)]*\)', r'\1', match[1])
        title = re.sub(r'<[^>]*>', '', title)
        title = unescape(title).lower().replace('`', '')
        slug = ''.join(c for c in title if c in ' -_' or unicodedata.category(c)[0] in 'LNM')
        slug = slug.replace(' ', '-')
        unique, suffix = slug, 0
        while unique in seen:
            suffix += 1
            unique = f'{slug}-{suffix}'
        seen.add(unique)
        result.add(unique)
    return result


def structure(path, text):
    errors = []
    if len(path.parts) > 2 and re.match(r'^\d', path.parts[1]):
        errors.append('thématique de premier niveau numérotée sous docs/')
    if path.suffix != '.md':
        return errors
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if path.name == 'index.md':
        for number, line in enumerate(lines):
            if re.match(r'^#{1,6}\s', line):
                continue
            if re.match(r'^\|[\s:|\-]+\|$', line):
                continue
            if line.startswith('|'):
                # En-tête d'un tableau, ou ligne de navigation comportant un lien.
                header = number + 1 < len(lines) and re.match(r'^\|[\s:|\-]+\|$', lines[number + 1])
                if re.search(r'\[[^\]]+\]\(', line) or header:
                    continue
            if re.match(r'^[-*+]\s', line) and re.search(r'\[[^\]]+\]\(', line):
                continue
            errors.append('index réservé aux titres et entrées de navigation : ' + line[:90])
    elif path.name != 'README.md':
        if len(lines) < 2 or not re.match(r'^#\s', lines[0]) or not lines[1].startswith('> '):
            errors.append('citation requise immédiatement après le H1')
    return errors


def check(root, paths):
    root = root.resolve()
    errors, notices = [], []
    cache = {}
    for relative in sorted(set(paths)):
        path = root / relative
        if not path.exists():
            continue  # Suppression locale non encore indexée.
        if relative.parts[0] == 'worktree' and relative != Path('worktree/README.md'):
            continue
        if any(part.startswith('.env') and part != '.env.example' for part in relative.parts):
            continue
        if path.is_symlink():
            errors.append(f'{relative} : lien symbolique non analysé')
            continue
        if not path.is_file():
            continue
        if relative.suffix != '.md':
            if relative.parts[0] == 'docs':
                errors.extend(f'{relative} : {e}' for e in structure(relative, ''))
            continue
        try:
            text = path.read_text(encoding='utf-8')
            if relative.parts[0] == 'docs':
                errors.extend(f'{relative} : {e}' for e in structure(relative, text))
            for target in links(text):
                if re.search(r'\$|\{\{|<[^>]+>', target):
                    notices.append(f'{relative} : cible dynamique à examiner : {target}')
                    continue
                url = urlsplit(target)
                if url.scheme or url.netloc:
                    continue
                dest = (path.parent / unquote(url.path)).resolve() if url.path else path
                if not dest.is_relative_to(root):
                    errors.append(f'{relative} : cible hors dépôt : {target}')
                    continue
                if not dest.exists():
                    errors.append(f'{relative} : cible absente : {target}')
                    continue
                if url.fragment:
                    if dest.suffix.lower() not in ('.md', '.html'):
                        notices.append(f'{relative} : ancre non vérifiée : {target}')
                        continue
                    if dest not in cache:
                        cache[dest] = anchors(dest.read_text(encoding='utf-8'), dest.suffix.lower() == '.md')
                    if unquote(url.fragment) not in cache[dest]:
                        errors.append(f'{relative} : ancre absente : {target}')
        except (OSError, UnicodeError, ValueError) as exc:
            errors.append(f'{relative} : analyse impossible : {exc}')
    return errors, sorted(set(notices))


def main():
    root = REPO_ROOT
    try:
        if not (root / 'docs/README.md').is_file():
            raise ValueError('source des conventions docs/README.md absente')
        output = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=root)
        paths = [Path(os.fsdecode(name)) for name in output.split(b'\0') if name]
        # Adoption bornée : les anciennes conventions documentaires restent inchangées.
        paths = [p for p in paths if p.parts[:2] == ('dev-book', 'templates') or p.as_posix() in (
            'AGENTS.md', 'docs/README.md', 'codebase-integrity/README.md',
            'worktree/README.md', 'dev-book/README.md') or
            (p.parent.as_posix() in ('dev-book/demand', 'dev-book/tasks') and
             re.match(r'(DEM|OPS|WEB|BFF|DOM)-[0-9]+-', p.name))]
        errors, notices = check(root, paths)
    except (OSError, ValueError, subprocess.CalledProcessError) as exc:
        print(f'Contrôle documentaire impossible : {exc}', file=sys.stderr)
        return 1
    for notice in notices:
        print('À examiner : ' + notice)
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print('Structure documentaire et liens locaux conformes ; limites : docs/README.md.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
