#!/usr/bin/env python3
"""Vérification déterministe des README ; règle de référence : docs/README.md."""
from pathlib import Path
import os
import re
import subprocess
import sys

# Le contrôle documentaire fournit déjà le bootstrap et le traitement des fences.
from check_docs import REPO_ROOT, without_fences, links


def readme_errors(text):
    clean = re.sub(r'<!--.*?-->', lambda m: '\n' * m[0].count('\n'), text, flags=re.S)
    lines = without_fences(clean).splitlines()
    original = clean.splitlines()
    # Le contenu interdit est vérifié aussi dans les exemples et commentaires.
    forbidden = (
        (r'!?\[[^\]\n]*\]\s*\(|\[[^\]\n]+\]\s*\[[^\]\n]*\]|^\s*\[[^\]]+\]:', 'lien Markdown interdit'),
        (r'(?:https?://|mailto:|www\.)\S+|<(?:a|img|link|iframe|source)\b', 'lien ou adresse interdit'),
        (r'(?<![\w])(?:\.\.?/|~/|/[A-Za-z]|[A-Za-z]:[\\/])\S*|\b[\w.-]+/[\w./-]+', 'chemin interdit'),
        (r'\b[0-9a-f]{40,64}\b|\b\d{4}-\d{2}-\d{2}\b|\b(?:DEM|OPS|WEB|BFF|DOM|DASH)-\d+\b', 'trace temporaire interdite'),
        (r'\b(?:actuellement|à ce jour|pour le moment|non commit[ée]|en cours)\b|\b\d+\s+(?:tests?|fichiers?|suites?)\b', 'état ou décompte temporaire interdit'),
    )
    content_errors = []
    for number, line in enumerate(text.splitlines(), 1):
        for pattern, message in forbidden:
            if re.search(pattern, line, re.I):
                content_errors.append((number, message))
    headings = []
    errors = content_errors
    for n, line in enumerate(lines, 1):
        match = re.match(r'^ {0,3}(#{1,6})\s+(.+?)(?:\s+#+\s*)?$', line)
        if match:
            headings.append((n, len(match[1]), match[2].strip()))
    def fail(n, message):
        errors.append((n, message))
    h1 = [h for h in headings if h[1] == 1]
    first = next((i for i, line in enumerate(lines, 1) if line.strip()), 1)
    if len(h1) != 1 or h1[0][0] != first:
        fail(first, 'un titre H1 unique est requis en tête du README')
    for previous, current in zip(headings, headings[1:]):
        if current[1] > previous[1] + 1:
            fail(current[0], 'niveau de titre sauté')
    for n, level, title in headings:
        if level == 2 and title not in ('Rôle et responsabilités', 'Conventions techniques'):
            fail(n, 'seules les deux rubriques responsabilités et conventions sont autorisées')
    sections = {}
    for title in ('Rôle et responsabilités', 'Conventions techniques'):
        found = [h for h in headings if h[1] == 2 and h[2] == title]
        if len(found) != 1:
            fail(1, f'rubrique H2 unique requise : {title}')
        else:
            sections[title] = found[0]
    if len(sections) == 2 and sections['Rôle et responsabilités'][0] > sections['Conventions techniques'][0]:
        fail(sections['Conventions techniques'][0], 'Rôle et responsabilités doit précéder Conventions techniques')
    for title, (start, _, _) in sections.items():
        end = next((n for n, level, _ in headings if n > start and level <= 2), len(lines) + 1)
        if title == 'Rôle et responsabilités':
            body = '\n'.join(lines[start:end - 1])
            if not re.search(r'^\s*[-*+]\s+\S', body, re.M):
                fail(start, 'liste de responsabilités requise')
            for n in range(start + 1, end):
                line = lines[n - 1]
                if line.strip() and not re.match(r'^(?:\s*[-*+]\s+| {2,}\S)', line):
                    fail(n, 'responsabilités attendues sous forme de liste')
            try:
                if links(body):
                    fail(start, 'renvoi documentaire interdit dans les responsabilités')
            except ValueError as exc:
                fail(start, str(exc))
            continue
        conventions = [h for h in headings if start < h[0] < end and h[1] == 3]
        if not conventions:
            fail(start, 'chaque convention requiert un titre H3 et une description')
        first_h3 = conventions[0][0] if conventions else end
        if any(line.strip() for line in lines[start:first_h3 - 1]):
            fail(start + 1, 'placer chaque convention sous son titre H3')
        for n, _, _ in conventions:
            stop = next((i for i, _, _ in headings if i > n), end)
            content = [(i, lines[i - 1].strip()) for i in range(n + 1, min(stop, end)) if lines[i - 1].strip()]
            # Une liste, citation, table, exemple ou lien seul ne décrit pas la règle.
            prose = content[0][1] if content else ''
            first_raw = next((line for line in original[n:min(stop, end) - 1] if line.strip()), '')
            if re.match(r'^(?: {4}|\t)', first_raw) or re.match(r'^(`{3,}|~{3,})', first_raw.strip()):
                prose = ''
            meaningful = re.sub(r'!?\[[^\]]*\]\([^)]*\)|<[^>]+>|[`*_~]', '', prose).strip()
            if not re.search(r'\w', meaningful) or re.match(r'^(?:[-*+]\s|\d+[.)]\s|[>|#]|[-*_]{3,}$)', prose):
                fail(n, 'description en prose requise après le titre H3, avant listes ou exemples')
    return errors


def check_readmes(root, paths):
    errors = []
    count = 0
    root_exception = False
    for relative in sorted(set(paths)):
        if relative.name.casefold() != 'readme.md':
            continue
        if relative.parts[0] == 'worktree':
            continue
        if any(p.startswith('.env') for p in relative.parts):
            continue
        path = root / relative
        if relative == Path('README.md') and path.is_file() and not path.is_symlink():
            root_exception = True
            continue  # Exception explicite : contenu inchangé ; liens contrôlés par check_docs.
        if (len(relative.parts) > 2 and relative.parts[:2] != ('webapp', 'base')
                and relative.as_posix() not in {
                    'webapp/dashboard/README.md', 'webapp/services/README.md',
                    'webapp/shared/README.md', 'webapp/schemas/README.md',
                    'webapp/server/README.md', 'webapp/sites/README.md',
                    'webapp/sites/showcase-immobilier/README.md',
                    'webapp/sites/client2-immobilier/README.md',
                } and (path.exists() or path.is_symlink())):
            errors.append(f'{relative}:1: README interdit à partir du deuxième niveau ; regrouper les règles au premier niveau')
        if path.is_symlink():
            errors.append(f'{relative}:1: README symbolique non analysé')
            continue
        if not path.exists():
            continue  # Suppression locale, comme dans le contrôle documentaire.
        count += 1
        try:
            if any(parent.is_symlink() for parent in path.parents if parent != root and parent.is_relative_to(root)):
                raise ValueError('parent symbolique non analysé')
            errors.extend(f'{relative}:{n}: {message}' for n, message in readme_errors(path.read_text(encoding='utf-8')))
        except (OSError, UnicodeError, ValueError) as exc:
            errors.append(f'{relative}:1: analyse impossible : {exc}')
    if not count and not root_exception:
        errors.append('Aucun README analysable découvert')
    return errors, count


def main():
    try:
        output = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=REPO_ROOT)
        paths = [Path(os.fsdecode(p)) for p in output.split(b'\0') if p]
        errors, count = check_readmes(REPO_ROOT, paths)
    except (OSError, subprocess.CalledProcessError) as exc:
        print(f'Inventaire README impossible : {exc}', file=sys.stderr)
        return 1
    print(f'{count} README analysés ; {len(errors)} écart(s).')
    if errors:
        print('\n'.join(errors), file=sys.stderr)
    return int(bool(errors))


if __name__ == '__main__':
    sys.exit(main())
