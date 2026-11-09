#!/usr/bin/env python3
"""Valider le classement des conventions, pas leur application dans le code."""
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
import sys

from check_docs import anchors, without_fences

ROOT = REPO_ROOT


def require(condition, message):
    if not condition:
        raise ValueError(message)


def unique(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'Clé JSON dupliquée : ' + key)
        result[key] = value
    return result


def local(root, name):
    require(isinstance(name, str) and name, 'Chemin local manquant')
    path = PurePosixPath(name)
    require(not path.is_absolute() and '..' not in path.parts and str(path) == name,
            'Chemin non canonique : ' + name)
    destination = root / name
    require(destination.resolve().is_relative_to(root.resolve()) and not destination.is_symlink(),
            'Chemin extérieur ou lié : ' + name)
    require(destination.is_file(), 'Fichier absent : ' + name)
    return destination


def validate(root, data):
    require(isinstance(data, dict) and set(data) == {'version', 'domaines', 'conventions'}, 'Structure du registre invalide')
    require(type(data['version']) is int and data['version'] == 1, 'Version du registre inconnue')
    domains = data['domaines']
    require(isinstance(domains, dict) and domains, 'Domaines manquants')
    require(all(isinstance(key, str) and key and isinstance(value, str) and value for key, value in domains.items()), 'Domaine invalide')
    require(len(set(domains.values())) == len(domains), 'Libellé de domaine dupliqué')
    require(isinstance(data['conventions'], list), 'Liste de conventions attendue')
    identifiers, sources = set(), set()
    for item in data['conventions']:
        require(isinstance(item, dict) and set(item) == {'id', 'nom', 'domaine', 'source', 'controles'}, 'Convention invalide')
        identifier = item['id']
        require(isinstance(identifier, str) and identifier and identifier not in identifiers, 'Identifiant de convention absent ou dupliqué')
        identifiers.add(identifier)
        require(isinstance(item['nom'], str) and item['nom'], identifier + ' : nom manquant')
        require(isinstance(item['domaine'], str) and item['domaine'] in domains, identifier + ' : domaine unique connu requis')
        source = item['source']
        require(isinstance(source, str) and source.count('#') == 1 and source not in sources, identifier + ' : source absente ou dupliquée')
        sources.add(source)
        name, anchor = source.split('#')
        require(PurePosixPath(name).name == 'README.md', identifier + ' : source attendue dans un README')
        text = without_fences(local(root, name).read_text())
        require('## Conventions techniques' in text, identifier + ' : chapitre Conventions techniques absent')
        section = text.split('## Conventions techniques', 1)[1]
        # Limiter les ancres à ce chapitre en préservant les collisions antérieures.
        section = section.split('\n## ', 1)[0]
        before = text.split('## Conventions techniques', 1)[0]
        require(anchor in anchors(before + '## Conventions techniques' + section) - anchors(before), identifier + ' : ancre de convention absente')
        require(isinstance(item['controles'], list) and item['controles'], identifier + ' : état de contrôle manquant')
        controls = set()
        for control in item['controles']:
            require(isinstance(control, dict) and set(control) == {'id', 'etat', 'mode', 'fichier', 'limite'}, identifier + ' : point de contrôle invalide')
            require(isinstance(control['id'], str) and control['id'] and control['id'] not in controls, identifier + ' : contrôle absent ou dupliqué')
            controls.add(control['id'])
            require(control['etat'] in ('implémenté', 'à implémenter'), identifier + ' : état inconnu')
            require(control['mode'] in ('automatique', 'revue humaine'), identifier + ' : mode inconnu')
            require(isinstance(control['limite'], str) and control['limite'], identifier + ' : portée ou limite manquante')
            if control['etat'] == 'implémenté':
                local(root, control['fichier'])
            else:
                require(control['fichier'] is None, identifier + ' : contrôle à implémenter ne doit pas annoncer un fichier existant')
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--list', action='store_true', help='Vue centrale par domaine, sans fichier dupliqué')
    args = parser.parse_args()
    try:
        data = validate(ROOT, json.loads((ROOT / 'codebase-integrity/conventions.json').read_text(), object_pairs_hook=unique))
        if args.list:
            for key, label in data['domaines'].items():
                print(label + ' :')
                entries = [item for item in data['conventions'] if item['domaine'] == key]
                if not entries:
                    print('  aucune convention recensée dans cet inventaire initial')
                for item in entries:
                    status = ', '.join(sorted({control['etat'] + ' (' + control['mode'] + ')' for control in item['controles']}))
                    print(f"  {item['id']} — {item['nom']} [{status}] ({item['source']})")
        else:
            print(f"Registre cohérent : {len(data['domaines'])} domaines, {len(data['conventions'])} conventions ; application des règles non évaluée.")
        return 0
    except (OSError, ValueError, TypeError, KeyError) as error:
        print('Registre refusé : ' + str(error), file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
