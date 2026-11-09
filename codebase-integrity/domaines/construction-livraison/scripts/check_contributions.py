#!/usr/bin/env python3
"""Vérifier les contributions depuis des objets Git, sans exécuter le candidat."""
from pathlib import Path as _Path
import sys as _sys
_common = _Path(__file__).resolve().parent
if not (_common / 'bootstrap.py').is_file():
    _common = next((p / 'codebase-integrity/commun' for p in _Path(__file__).resolve().parents if (p / 'codebase-integrity/commun').is_dir()), _common)
_sys.path.insert(0, str(_common))
from bootstrap import REPO_ROOT, configure_imports
configure_imports()

import argparse
import json
from pathlib import Path, PurePosixPath
import re
import sys

import check_commits as commits
import check_demands as demands
import check_docs as docs


def require(condition, message):
    if not condition:
        raise ValueError(message)


def path_name(value):
    require(isinstance(value, str) and value and '\x00' not in value, 'chemin invalide')
    path = PurePosixPath(value)
    require(not path.is_absolute() and '..' not in path.parts and str(path) == value,
            f'chemin non canonique : {value!r}')
    return value


def objects(repo, ref):
    result = {}
    for entry in commits.git(repo, 'ls-tree', '-rz', ref).split('\0'):
        if entry:
            metadata, name = entry.split('\t', 1)
            mode, kind, oid = metadata.split()
            result[name] = (mode, kind, oid)
    return result


def content(repo, tree, name):
    path_name(name)
    require(name in tree and tree[name][0] in ('100644', '100755'),
            f'fichier régulier absent : {name}')
    return commits.git(repo, 'cat-file', 'blob', tree[name][2])


def changed(repo, before, after):
    # Sans détection des renommages : les deux côtés sont conservés comme D + A.
    return set(filter(None, commits.git(repo, 'diff', '--no-renames', '--name-only',
                                       '-z', before, after, '--').split('\0')))


def demand_type(text):
    fields = demands.type_fields(text)
    require(len(fields) == 1 and fields[0] in
            ('- Type : développement', '- Type : consolidation'), 'type absent, invalide ou ambigu')
    return fields[0].split(' : ', 1)[1]


def unique_json(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f'clé JSON dupliquée : {key}')
        result[key] = value
    return result


def declaration(text):
    blocks = []
    fence, body, selected = None, [], False
    for line in text.splitlines():
        marker = re.match(r'^ {0,3}(`{3,}|~{3,})(.*)$', line)
        if fence:
            if marker and marker[1][0] == fence[0] and len(marker[1]) >= len(fence) and not marker[2].strip():
                if selected:
                    blocks.append('\n'.join(body))
                fence = None
            elif selected:
                body.append(line)
        elif marker:
            fence, body = marker[1], []
            selected = marker[2].strip() == 'contribution-json'
    require(not (fence and selected), 'déclaration non fermée')
    require(len(blocks) == 1, 'une déclaration contribution-json unique est requise')
    value = json.loads(blocks[0], object_pairs_hook=unique_json)
    keys(value, {'version', 'corrections', 'accompagnements', 'sans_correction'})
    require(type(value['version']) is int and value['version'] == 1, 'version inconnue')
    require(isinstance(value['corrections'], list) and isinstance(value['accompagnements'], list),
            'listes de corrections et accompagnements requises')
    require(isinstance(value['sans_correction'], str), 'motif sans_correction invalide')
    return value


def keys(value, expected):
    require(isinstance(value, dict) and set(value) == expected, 'champs de déclaration invalides')


def paths_list(value):
    require(isinstance(value, list) and value, 'liste de chemins non vide requise')
    paths = [path_name(p) for p in value]
    require(len(paths) == len(set(paths)), 'chemin dupliqué')
    return set(paths)


def convention(repo, tree, target):
    require(isinstance(target, str) and target.count('#') == 1, 'référence de convention invalide')
    name, anchor = target.split('#')
    require(PurePosixPath(name).name == 'README.md' and anchor, 'convention attendue dans un README avec ancre')
    text = docs.without_fences(content(repo, tree, name))
    section = re.search(r'^## Conventions techniques\s*\n(.*?)(?=^#{1,2} |\Z)', text, re.M | re.S)
    # Garder le préfixe conserve les suffixes des titres déjà rencontrés.
    # La différence exclut leurs ancres et les sections suivantes restent hors champ.
    local_anchors = (docs.anchors(text[:section.end()]) - docs.anchors(text[:section.start()])
                     if section else set())
    require(anchor in local_anchors,
            f'ancre de convention absente : {target}')


def consolidation(repo, initial, final, text, touched, traces):
    value = declaration(text)
    covered = set()
    require(bool(value['corrections']) != bool(value['sans_correction'].strip()),
            'corrections ou motif sans correction requis, exclusivement')
    if not value['corrections']:
        require(value['sans_correction'].strip().startswith('sans correction de code : ')
                and value['sans_correction'].split(':', 1)[1].strip(),
                'motif attendu : sans correction de code : justification')
    for correction in value['corrections']:
        keys(correction, {'chemins', 'convention', 'controles'})
        names = paths_list(correction['chemins'])
        convention(repo, final, correction['convention'])
        for control in paths_list(correction['controles']):
            content(repo, final, control)
            require(control in touched and (control not in initial or initial[control][2] != final[control][2]),
                    f'contrôle non ajouté ou renforcé : {control}')
        require(not covered & names, 'correction déclarée plusieurs fois')
        covered.update(names)
    for accompaniment in value['accompagnements']:
        keys(accompaniment, {'chemins', 'motif'})
        require(isinstance(accompaniment['motif'], str) and accompaniment['motif'].strip(),
                'motif d’accompagnement requis')
        names = paths_list(accompaniment['chemins'])
        require(not covered & names, 'chemin déclaré plusieurs fois')
        covered.update(names)
    expected = touched - traces
    require(covered == expected,
            f'couverture incorrecte ; absents={sorted(expected-covered)!r}, superflus={sorted(covered-expected)!r}')


def check(repo, base, head, expected_demand=None):
    require(commits.git(repo, 'rev-parse', '--is-shallow-repository').strip() == 'false',
            'historique superficiel interdit')
    base, head = commits.resolve(repo, base), commits.resolve(repo, head)
    ancestor = commits.git(repo, 'merge-base', base, head).strip()
    errors, count = commits.check_range(repo, base, head)
    require(not errors, '\n'.join(errors))
    require(count > 0, 'plage vide : aucune contribution vérifiée')
    initial, final = objects(repo, ancestor), objects(repo, head)
    base_tree = objects(repo, base)
    demand_paths, touched, traces, types = {}, {}, {}, set()
    for sha in commits.git(repo, 'rev-list', '--reverse', f'{base}..{head}').splitlines():
        scope, identifier = commits.message_fields(commits.git(repo, 'show', '-s', '--format=%B', sha))
        require(expected_demand is None or identifier == expected_demand,
                'amorçage réservé à la seule demande DEM-001')
        demand_paths[identifier] = next(p for p in final
            if re.fullmatch(rf'dev-book/demand/{identifier}-[^/]+\.md', p))
        name = demand_paths[identifier]
        kind = demand_type(content(repo, final, name))
        require(expected_demand is None or kind == 'consolidation',
                'amorçage réservé à une consolidation')
        types.add(kind)
        # Vérifie aussi une ancienne version, même si le fichier a été renommé.
        for tree in (base_tree, objects(repo, sha)):
            previous = [p for p in tree if re.fullmatch(rf'dev-book/demand/{identifier}-[^/]+\.md', p)]
            require(len(previous) <= 1, f'{identifier} ambigu dans un état intermédiaire')
            if previous:
                require(demand_type(content(repo, tree, previous[0])) == kind,
                        f'{identifier} : changement de type interdit')
        names = changed(repo, sha + '^', sha)
        if kind == 'développement':
            require(not any(p == 'codebase-integrity' or p.startswith('codebase-integrity/') for p in names),
                    f'{sha} : développement touchant codebase-integrity/')
        touched.setdefault(identifier, set()).update(names)
        trace = traces.setdefault(identifier, {name})
        if scope != identifier:
            trace.update(p for p in final if re.fullmatch(rf'dev-book/tasks/{scope}-[^/]+\.md', p))
    require(len(types) == 1, 'mélange développement et consolidation interdit')
    if types == {'consolidation'}:
        for identifier, name in demand_paths.items():
            consolidation(repo, initial, final, content(repo, final, name), touched[identifier], traces[identifier])
    # Ne lit pas la copie de travail ; le diff final est inclus dans les chemins par commit.
    require(changed(repo, ancestor, head) <= set().union(*touched.values()), 'diff final non couvert')
    return count


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', required=True, type=Path)
    parser.add_argument('--base', required=True)
    parser.add_argument('--head', default='HEAD')
    parser.add_argument('--demand', choices=['DEM-001'], help='restriction pour l’amorçage initial')
    args = parser.parse_args(argv)
    try:
        count = check(args.repo.resolve(), args.base, args.head, args.demand)
        print(f'Contribution conforme : {count} commits ; adéquation soumise à revue humaine.')
        return 0
    except (OSError, ValueError, UnicodeError) as exc:
        print(f'Contribution refusée : {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
