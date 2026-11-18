#!/usr/bin/env python3
"""Présentation des contrôles AIDE ; sorties détaillées conservées hors du dépôt."""
from pathlib import Path
import os
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parents[2]
STEPS = (
    ('Registre des conventions', 'Vérifie les références et la déclaration des contrôles, pas leur application.', 'codebase-integrity/domaines/fiabilite-verifications/scripts/check_registry.py'),
    ('Demandes et cartes', 'Vérifie la déclaration du type des demandes.', 'codebase-integrity/domaines/construction-livraison/scripts/check_demands.py'),
    ('Documentation et README', 'Vérifie les règles documentaires ; les écarts existants font échouer cette étape.', 'codebase-integrity/domaines/fiabilite-verifications/scripts/check_docs.py'),
)


PALETTE = {'blue': 34, 'green': 32, 'red': 31, 'yellow': 33, 'gray': 90, 'magenta': 35}


def supports_color(stream, env):
    return stream.isatty() and env.get('TERM', '') not in ('', 'dumb') and 'NO_COLOR' not in env


def paint(text, color, enabled):
    return f'\033[{PALETTE[color]}m{text}\033[0m' if enabled else text


def main():
    colored = supports_color(sys.stdout, os.environ)
    def style(text, color):
        return paint(text, color, colored)

    report = Path(tempfile.mkdtemp(prefix='aide-check-'))
    failed = []
    total = len(STEPS)
    print(f'Conventions documentaires et registre — {total} étapes\n', flush=True)
    print('Contexte : ' + str(ROOT) + '\n', flush=True)
    print(style('INFO — Applique les conventions du registre, des demandes et des documents ; les tests des vérificateurs se lancent séparément avec make verifiers-test.', 'blue') + '\n', flush=True)
    for number, (title, explanation, script) in enumerate(STEPS, 1):
        print(style(f'[{number}/{total}] EN COURS — {title}', 'blue'), flush=True)
        print('  ' + style(explanation, 'gray'), flush=True)
        start = time.monotonic()
        log = report / f'{number}.log'
        try:
            with log.open('w') as stream:
                result = subprocess.run([sys.executable, '-B', str(ROOT / script)], cwd=ROOT, stdout=stream, stderr=subprocess.STDOUT)
            code = result.returncode
        except OSError as exc:
            log.write_text(str(exc))
            code = 1
        detail = log.read_text(errors='replace')
        status = 'RÉUSSI' if code == 0 else 'ÉCHEC'
        print('  ' + style(status, 'green' if code == 0 else 'red') + style(f' — {time.monotonic() - start:.1f} s', 'gray'), flush=True)
        if code:
            failed.append(title)
            print('  Détails : ' + str(log), flush=True)
            print('  ' + '\n  '.join(detail.splitlines() if len(detail.splitlines()) <= 8 else detail.splitlines()[:3]), flush=True)
        print(flush=True)
    print(style(f'Résultat : {total - len(failed)}/{total} étapes réussies.', 'red' if failed else 'green'), flush=True)
    if failed:
        print(style('À corriger : ', 'red') + ', '.join(failed), flush=True)
    print('Rapport complet : ' + str(report), flush=True)
    return int(bool(failed))


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print('\nContrôle interrompu ; aucun succès global établi.', file=sys.stderr)
        sys.exit(130)
