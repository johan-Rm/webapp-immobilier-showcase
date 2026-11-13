#!/usr/bin/env python3
"""Consultation locale des demandes et cartes, sans modifier leurs verdicts."""
import argparse
from collections import defaultdict
from dataclasses import dataclass
import os
from pathlib import Path
import re
import sys
import unicodedata

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'codebase-integrity/domaines/construction-livraison/scripts'))
from worktrees import context


def plain(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text.lower())
                   if unicodedata.category(c) != 'Mn')


@dataclass(frozen=True)
class Document:
    identifier: str
    title: str
    demand: str
    layer: str
    state: str
    source: Path
    closed: bool = False


def parse_document(path, task=False):
    text = path.read_text(encoding='utf-8')
    # Les extraits de code et exemples cités ne sont pas des métadonnées.
    text = re.sub(r'^```[^\n]*\n.*?^```[^\n]*$', '', text, flags=re.M | re.S)
    heading = re.search(r'^#\s+([^\n]+)', text, re.M)
    title = heading[1] if heading else path.stem
    pattern = r'\b[A-Z]+-\d+\b' if task else r'\bDEM-\d+\b'
    identifier = re.search(pattern, title)
    if not identifier:
        # Certains brouillons historiques réservent le numéro dans leurs métadonnées.
        identifier = re.search(r'^- (?:Identifiant réservé|Référence réservée)\s*:\s*(DEM-\d+)', text, re.M)
    if not identifier:
        return None
    identifier = identifier[1] if identifier.lastindex else identifier[0]
    demand = re.search(r'^- Demande\s*:\s*`?(DEM-\d+)', text, re.M)
    layer = re.search(r'^- Couche\s*:\s*`?([\w-]+)', text, re.M)
    state = re.search(r'^(?:- )?[ÉE]tat\s*:\s*(.+)', text, re.M)
    state = state[1].strip() if state else 'inconnu : état absent ou format non reconnu'
    closed = bool(re.match(r'^(livree|cloturee|livraison terminee)\b', plain(state)))
    # Une clôture explicite ultérieure conserve sa preuve, sans modifier l'état source.
    closure = re.search(r'^(?:livraison (?:du perimetre accepte )?terminee|suivi cloture\s*:)[^\n]*', plain(text), re.M)
    if closure:
        closed = True
        state = 'Livraison terminée (trace de clôture) ; état initial : ' + state
    return Document(identifier, title, demand[1] if demand else '',
                    layer[1] if layer else 'inconnue', state, path, closed)


def scan(cwd=None):
    principal, records = context(cwd or Path.cwd())
    demands, tasks, warnings = defaultdict(list), defaultdict(list), []
    locations = [(principal / 'tmp', False)]
    for record in records:
        tree = Path(record['worktree'])
        if not tree.is_dir():
            warnings.append(f'Worktree inaccessible : {tree}')
            continue
        locations.extend([(tree / 'dev-book/demand', False), (tree / 'dev-book/tasks', True)])
    seen = set()
    for directory, task in locations:
        if not directory.is_dir():
            warnings.append(f'Source absente ou inaccessible : {directory}')
            continue
        try:
            paths = sorted(directory.glob('*.md'))
        except OSError:
            warnings.append(f'Source inaccessible : {directory}')
            continue
        for path in paths:
            if path in seen:
                continue
            seen.add(path)
            try:
                doc = parse_document(path, task)
            except (OSError, UnicodeError):
                warnings.append(f'Source illisible : {path}')
                continue
            if doc:
                (tasks if task else demands)[doc.identifier].append(doc)
            elif re.match(r'(DEM|OPS|WEB|BFF|DOM|DASH)-\d+', path.name):
                warnings.append(f'Identifiant non interprétable : {path}')
    return dict(demands), dict(tasks), warnings


def effective_closed(documents):
    return any(doc.closed for doc in documents)


def variants(documents):
    grouped = defaultdict(list)
    for doc in documents:
        grouped[(doc.title, doc.demand, doc.layer, doc.state)].append(doc)
    return list(grouped.values())


def describe(documents, task=False):
    groups = variants(documents)
    lines = []
    if len(groups) > 1:
        lines.append('  ⚠ États ou métadonnées divergents ; consulter les sources.')
    for copies in groups:
        doc = copies[0]
        label = f'{doc.identifier} | {doc.title}'
        if task:
            label += f' | {doc.layer}'
        lines.append(f'  {label} | {doc.state}')
        for copy in copies:
            lines.append('    Source : ' + str(copy.source))
    return lines


def render(demands, tasks, mode, selected=None):
    if selected and selected not in demands:
        raise ValueError('Demande inconnue : ' + selected)
    # Le filtre explicite permet aussi de consulter une demande déjà livrée.
    active = {key for key, docs in demands.items() if not effective_closed(docs)}
    keys = [selected] if selected else sorted(active)
    lines = (['États déclarés localement ; sans clôture explicite reconnue, livraison non établie.']
             if keys else ['Aucune demande en cours.'])
    for key in keys:
        lines.extend(describe(demands[key]))
        if mode == 'tasks':
            found = False
            for _, docs in sorted(tasks.items()):
                relevant = [doc for doc in docs if doc.demand == key]
                if relevant:
                    found = True
                    lines.extend(describe(relevant, task=True))
            if not found:
                lines.append('  Aucune carte trouvée ; découpage absent ou source manquante.')
    if not selected:
        for key in sorted(demands):
            docs = demands[key]
            if effective_closed(docs) and (len(variants(docs)) > 1 or any('état initial' in d.state for d in docs)):
                lines.append(f'Information : {key} exclue des demandes en cours : clôture explicite ; états historiques conservés.')
                for doc in docs:
                    if doc.closed:
                        lines.append('  Source de clôture : ' + str(doc.source))
        for _, docs in sorted(tasks.items()):
            for doc in docs:
                if not doc.demand or doc.demand not in demands:
                    lines.append(f'⚠ Demande absente ou inconnue pour {doc.identifier} : {doc.source}')
    return '\n'.join(lines) if lines else 'Aucune demande en cours.'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['demands', 'tasks'])
    parser.add_argument('demand', nargs='?', default=os.environ.get('AIDE_OPERAND') or None)
    args = parser.parse_args()
    if args.demand and (args.mode != 'tasks' or not re.fullmatch(r'DEM-\d{3,}', args.demand)):
        parser.error('Utiliser make tasks DEM-005 ou make demands sans argument')
    try:
        demands, tasks, warnings = scan()
        print(render(demands, tasks, args.mode, args.demand))
        for warning in warnings:
            print('⚠ ' + warning)
        return 0
    except (OSError, ValueError) as exc:
        parser.exit(1, f'Erreur : {exc}\n')


if __name__ == '__main__':
    sys.exit(main())
