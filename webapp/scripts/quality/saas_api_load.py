#!/usr/bin/env python3
"""Mesure manuelle bornée des lectures SaaS via un BFF Dashboard local."""
import json
import math
import os
from pathlib import Path
import re
import stat
import subprocess
import tempfile
from datetime import datetime, timezone
from urllib.parse import urlsplit
from uuid import UUID, uuid4

IMAGE = 'grafana/k6:1.6.1@sha256:a5ad6bc089a08d77c3ec49f3db8c6fa7a148e4073efcac44c675dbaf3568d8e1'
ROOT = Path(__file__).resolve().parents[2]
SCRIPT = Path(__file__).resolve().parent / 'load/saas-read.js'


def configuration(env):
    if env.get('GD_TARGET') != 'dashboard':
        raise ValueError('GD_TARGET=dashboard requis pour le BFF SaaS')
    try:
        u = urlsplit(env.get('QUALITY_BASE_URL', ''))
        if u.scheme != 'http' or u.hostname not in ('127.0.0.1', '::1') or u.username or u.password or u.path not in ('', '/') or u.query or u.fragment or not u.port:
            raise ValueError()
        origin = f'http://{u.netloc}'
    except ValueError:
        raise ValueError('Origine HTTP locale explicite avec port requise') from None
    profile = env.get('QUALITY_LOAD_PROFILE') or 'smoke'
    if profile not in ('smoke', 'measure'):
        raise ValueError('Profil smoke ou measure requis')
    ids = []
    for name in ('QUALITY_PROJECT_ID', 'QUALITY_ARTICLE_ID'):
        try:
            value = env.get(name, '')
            parsed = UUID(value)
            if str(parsed) != value.lower():
                raise ValueError()
            ids.append(str(parsed))
        except (ValueError, AttributeError):
            raise ValueError(f'{name} doit être un UUID canonique') from None
    file_name = env.get('QUALITY_SESSION_FILE')
    if not file_name:
        raise ValueError('QUALITY_SESSION_FILE requis')
    path = Path(file_name)
    try:
        info = path.lstat()
        if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_mode & 0o077 or info.st_size > 128:
            raise ValueError()
        session = path.read_text(encoding='utf-8').strip()
    except (OSError, UnicodeError, ValueError):
        raise ValueError('Fichier de session inaccessible ou permissions non privées') from None
    if not re.fullmatch(r'[A-Za-z0-9_-]{43}', session):
        raise ValueError('Format de session invalide')
    return {'origin': origin, 'profile': profile, 'project': ids[0], 'article': ids[1], 'session': session}


def summarize(raw, expected):
    try:
        metrics = raw['metrics']
        requests = metrics['http_reqs']['count']
        checks = metrics['checks']
        duration = metrics['http_req_duration']
        if requests != expected or checks['fails'] != 0 or checks['passes'] != expected * 2 or metrics['http_req_failed']['value'] != 0:
            raise ValueError()
        latency = {key: duration[key] for key in ('min', 'med', 'max', 'p(90)', 'p(95)') if isinstance(duration.get(key), (int, float)) and not isinstance(duration.get(key), bool) and math.isfinite(duration[key]) and duration[key] >= 0}
        if 'med' not in latency:
            raise ValueError()
        return {'requests': requests, 'latency_ms': latency}
    except (KeyError, TypeError, ValueError):
        raise ValueError('Mesure vide, incomplète ou vérifications échouées') from None


def run(env):
    config = configuration(env)
    results = {}
    with tempfile.TemporaryDirectory(prefix='saas-read-load-') as directory:
        folder = Path(directory)
        settings = folder / 'config.json'
        settings.write_text(json.dumps(config), encoding='utf-8')
        settings.chmod(0o600)
        for scenario in ('list', 'detail'):
            container = 'saas-read-load-' + uuid4().hex
            report = folder / f'{scenario}.json'
            command = ['docker', 'run', '--pull=never', '--log-driver=none', '--rm', '--name', container, '--network', 'host', '--user', f'{os.getuid()}:{os.getgid()}',
                       '-v', f'{settings}:/run/inputs/config.json:ro', '-v', f'{SCRIPT}:/scripts/saas-read.js:ro',
                       '-v', f'{folder}:/reports', '-e', f'SAAS_SCENARIO={scenario}', IMAGE,
                       'run', '--quiet', '--summary-export', f'/reports/{scenario}.json', '/scripts/saas-read.js']
            try:
                completed = subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=45, check=False)
                if completed.returncode:
                    raise ValueError(f'Scénario {scenario} échoué ; vérifier accès et réponses')
                results[scenario] = summarize(json.loads(report.read_text(encoding='utf-8')), 30 if config['profile'] == 'measure' else 3)
            except (OSError, subprocess.TimeoutExpired, json.JSONDecodeError):
                raise ValueError(f'Mesure {scenario} impossible ou interrompue') from None
            finally:
                subprocess.run(['docker', 'rm', '--force', container], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False, timeout=5)
    output = ROOT / '.tmp/quality/saas-api-load' / (datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ') + '-' + uuid4().hex[:8])
    output.mkdir(parents=True, exist_ok=False)
    report = {'target': 'dashboard', 'profile': config['profile'], 'latencies_informative': True, 'scenarios': results}
    (output / 'summary.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(f'Lectures SaaS réussies ; latences informatives. Rapport : {output}')
    return report


if __name__ == '__main__':
    print('INACTIF — Charge des lectures SaaS suspendue ; aucun test exécuté.')
