#!/usr/bin/env python3
"""Présentation des contrôles verbeux ; résultat et journal intégral conservés."""
import os
import re
from pathlib import Path
import subprocess
import sys
import tempfile
import time

from run_aide_checks import paint, supports_color

PROFILES = {
    'conventions': ('Conventions frontend regroupées', 'INFO — Exécute les vérificateurs frontend dans Docker ; nécessite webapp/.env et une image utilisable. Le premier échec arrête la chaîne.'),
    'tests-python': ('Tests Python des vérificateurs', 'INFO — Exécute les cas conformes et invalides des outils Python dans des environnements temporaires.'),
    'tests-typescript': ('Tests Vitest des vérificateurs', 'INFO — Vérifie les moteurs et commandes TypeScript sur leurs cas conformes, violations et exceptions.'),
    'tests-bun': ('Tests Bun des vérificateurs', 'INFO — Vérifie les contrôles de sections script setup et de placement des types.'),
    'lint': ('Lint de Codebase Integrity', 'INFO — Vérifie les règles ESLint du code des vérificateurs ; ne contrôle pas le lint de toute l’application Nuxt.'),
    'types': ('Placement des types', 'INFO — Contrôle le placement des types manuels partagés ; ce contrôle ne remplace pas TypeScript ou Vue TSC.'),
    'images': ('Conventions des images', 'INFO — Vérifie AppImage et les propriétés interdites ; ne prouve ni le rendu ni l’accessibilité des images.'),
    'business': ('Logique métier des composants', 'INFO — Signale les calculs suspects sur l’état global. Chaque avertissement nécessite une revue ; aucune correction automatique.'),
    'script': ('Sections script setup', 'INFO — Vérifie les sections et leur ordre ; les exceptions temporaires exactes sont signalées sans être élargies.'),
    'soc': ('Responsabilités des composants', 'INFO — Signale les appels réseau et mutations de store reconnaissables ; détection partielle à relire humainement.'),
    'quality': ('Qualité du code', 'INFO — Bloque les ternaires imbriqués détectés et signale commentaires, profondeur et dettes à relire.'),
    'guards': ('Gardes défensives à examiner', 'INFO — Repère des gardes potentiellement redondantes ; seul l’examen du contrat de type permet de décider de leur suppression.'),
    'services': ('Indépendance des services', 'INFO — Vérifie les imports de frameworks interdits dans les services ; ne garantit pas toute la séparation métier.'),
    'devbook': ('Traces du dev-book', 'INFO — Vérifie les cartes modifiées depuis la base Git explicite, leurs métadonnées et les références de verdict ; ne valide pas la pertinence des preuves.'),
}


def run(profile, command):
    # Le présentateur parent capture déjà le journal complet et gère le contexte.
    if os.environ.get('LIVE') == '1' and os.environ.get('CHECK_PRESENTATION_ACTIVE') == '1':
        try:
            if profile == 'conventions' and '--env-file' in command:
                index = command.index('--env-file') + 1
                if index >= len(command) or not Path(command[index]).is_file():
                    raise FileNotFoundError('Fichier d’environnement absent ; aucun vérificateur lancé.')
            return subprocess.run(command, env={**os.environ, 'NO_COLOR': '1', 'TERM': 'dumb'}).returncode
        except OSError as exc:
            print(str(exc), flush=True)
            return 2
    title, description = PROFILES[profile]
    colored = supports_color(sys.stdout, os.environ)
    print(title + '\n', flush=True)
    print(paint(description, 'blue', colored) + '\n', flush=True)
    print('Contexte : ' + str(Path.cwd()), flush=True)
    if profile not in ('devbook', 'conventions', 'tests-python', 'tests-typescript', 'tests-bun', 'lint'):
        print('Sources : ' + str(Path(os.environ.get('AIDE_WEBAPP_ROOT', '../webapp')).resolve()), flush=True)
        print('Les autres worktrees ne sont pas intégrés à ces sources.', flush=True)
    print(paint('[1/1] EN COURS — Exécuter le contrôle', 'blue', colored), flush=True)
    descriptor, name = tempfile.mkstemp(prefix=profile + '-check-', suffix='.log')
    start = time.monotonic()
    not_run = False
    with os.fdopen(descriptor, 'w') as stream:
        try:
            if profile == 'conventions' and '--env-file' in command:
                index = command.index('--env-file') + 1
                if index >= len(command) or not Path(command[index]).is_file():
                    raise FileNotFoundError('Fichier d’environnement absent : ' + (command[index] if index < len(command) else '(non précisé)') + '. Aucun vérificateur lancé.')
            # Le journal reste sans couleurs, même si un outil enfant force son affichage.
            result = subprocess.run(command, stdout=stream, stderr=subprocess.STDOUT, env={**os.environ, 'NO_COLOR': '1', 'TERM': 'dumb'})
            code = result.returncode
        except OSError as exc:
            stream.write(str(exc))
            code = 2
            not_run = True
    lines = Path(name).read_text(errors='replace').splitlines()
    print(paint('Résultat : ' + ('NON EXÉCUTÉ' if not_run else 'ÉCHEC' if code else 'RÉUSSI'), 'yellow' if not_run else 'red' if code else 'green', colored) + f' — {time.monotonic() - start:.1f} s', flush=True)
    displayed = lines if len(lines) <= 12 else lines[-3:] if code else lines[:2]
    if len(lines) > 12:
        summaries = [line for line in lines if re.search(r'^(?:⚠|✗|✓|Exception temporaire)|^\s*(?:Test Files|Tests|Ran \d+ tests?|\d+ (?:pass|fail))\b', line)]
        if profile.startswith('tests-'):
            summaries = [line for line in summaries if not line.startswith('✓')]
        if summaries:
            displayed = summaries[:8] + ([] if profile.startswith('tests-') and not code else [line for line in displayed if line.strip() and line not in summaries])
    for line in displayed:
        print('  ' + paint(line, 'yellow', colored) if line.startswith('⚠') else '  ' + line, flush=True)
    if not code:
        print('  Aucun écart bloquant ; examiner les avertissements éventuels.', flush=True)
    if len(displayed) < len(lines):
        print(f'  Sortie abrégée : {len(displayed)} lignes sur {len(lines)} ; consulter le rapport.', flush=True)
    print('Rapport complet : ' + name, flush=True)
    return code if code >= 0 else 128 - code


def main():
    if len(sys.argv) < 4 or sys.argv[1] not in PROFILES or sys.argv[2] != '--':
        print('Usage : run_check_output.py <profil> -- commande [arguments]', file=sys.stderr)
        return 2
    return run(sys.argv[1], sys.argv[3:])


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print('\nContrôle interrompu ; aucun succès établi.', file=sys.stderr)
        sys.exit(130)
