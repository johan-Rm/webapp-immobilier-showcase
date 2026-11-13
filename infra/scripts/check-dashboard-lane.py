#!/usr/bin/env python3
"""Smoke HMR isolé depuis un commit explicite, sans API ni données utilisateur."""
import argparse
import json
import os
import signal
from pathlib import Path
import socket
import subprocess
import tempfile
import time
from urllib.error import HTTPError
from urllib.request import ProxyHandler, Request, build_opener

ROOT = Path(__file__).resolve().parents[2]


def run(argv, cwd, timeout=240):
    result = subprocess.run(argv, cwd=cwd, capture_output=True, text=True, timeout=timeout)
    if result.returncode:
        raise RuntimeError(f'{argv[0]} a échoué : {result.stderr[-2500:]}')
    return result.stdout.strip()


def free_port():
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        return listener.getsockname()[1]


def wait_http(url, timeout):
    opener = build_opener(ProxyHandler({}))
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            with opener.open(url, timeout=5) as response:
                if response.status == 200:
                    return
        except OSError:
            time.sleep(1)
    raise RuntimeError('Délai HTTP dépassé : ' + url)


BROWSER = r'''
const { chromium } = require(process.argv[2]);
const fs = require('node:fs');
(async () => {
 const [direct, proxy, source, executablePath] = process.argv.slice(3);
 const browser = await chromium.launch({executablePath, headless: true, args: ['--no-sandbox',
   '--host-resolver-rules=MAP dashboard.wt-dashboard.localhost 127.0.0.1', '--no-proxy-server']});
 try {
  const pages = [];
  for (const url of [direct, proxy]) {
   const page = await browser.newPage();
   await page.route('**/api/saas/**', route => route.fulfill({status: 401,
     contentType: 'application/json', body: JSON.stringify({error: {code:'authentication_required'}})}));
   let navigations = 0;
   let connected = false;
   page.on('framenavigated', frame => { if(frame === page.mainFrame()) navigations++; });
   page.on('websocket', socket => socket.on('framereceived', event => {
     if(String(event.payload).includes('"connected"')) connected = true;
   }));
   await page.goto(url + '/connexion', {waitUntil: 'networkidle', timeout: 120000});
   await page.locator('input[type=email]').fill('hmr-preserved@example.test');
   pages.push({page, baseline: navigations, navigationCount: () => navigations, connected: () => connected});
  }
  const original = fs.readFileSync(source, 'utf8');
  try {
   fs.writeFileSync(source, original.replace('<UCard>', '<UCard><span data-hmr-proof="updated">HMR proof</span>'));
   for (const item of pages) {
    await item.page.locator('[data-hmr-proof=updated]').waitFor({timeout: 60000});
    if(await item.page.locator('input[type=email]').inputValue() !== 'hmr-preserved@example.test')
      throw new Error('État du formulaire perdu');
    if(item.navigationCount() !== item.baseline) throw new Error('Full reload détecté');
    if(!item.connected()) throw new Error('WebSocket Vite connecté non observé');
   }
  } finally { fs.writeFileSync(source, original); }
  console.log(JSON.stringify({hmrDirect:true, hmrProxy:true, inputPreserved:true, fullReload:false}));
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', required=True, help='commit local validé portant OPS-018/019')
    parser.add_argument('--image', required=True, help='image Nuxt dev locale, aucun build ni pull')
    parser.add_argument('--nginx-image', required=True, help='image Nginx locale')
    parser.add_argument('--playwright-module', required=True, type=Path)
    parser.add_argument('--chromium', required=True, type=Path, help='exécutable Chromium local, aucun téléchargement')
    parser.add_argument('--timeout', type=int, default=240)
    args = parser.parse_args()
    base = run(['git', 'rev-parse', '--verify', args.base + '^{commit}'], ROOT)
    for image in (args.image, args.nginx_image):
        run(['docker', 'image', 'inspect', image], ROOT)
    stacks = []
    with tempfile.TemporaryDirectory(prefix='dashboard-hmr-') as folder:
        repo = Path(folder) / 'repo'
        repo.mkdir()
        archive = Path(folder) / 'source.tar'
        run(['git', 'archive', '--output', str(archive), base], ROOT)
        run(['tar', '-xf', str(archive), '-C', str(repo)], ROOT)
        for command in (['init', '-qb', 'develop'], ['config', 'user.name', 'Smoke fixture'],
                        ['config', 'user.email', 'fixture@example.invalid'], ['add', '.'],
                        ['-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture validée']):
            run(['git', *command], repo)
        (repo / 'tmp').mkdir(exist_ok=True)
        (repo / 'tmp/demande-dashboard-smoke.md').write_text(
            '# DEM-007 — Fixture Dashboard\n\n- Type : consolidation\n- État : en cours\n')
        settings_path = repo / 'infra/config/layers.json'
        settings = json.loads(settings_path.read_text())
        # Ports éphémères de la fixture ; aucun port utilisateur réutilisé.
        ports = {}
        for layer in settings['layers']:
            run(['python3', 'codebase-integrity/domaines/construction-livraison/scripts/worktrees.py',
                 'add', '--layer', layer, '--branch', 'layers/' + layer, '--base', 'develop'], repo)
            tree = repo / 'worktree' / layer
            dev, public = free_port(), free_port()
            ports[layer] = (dev, public)
            config = json.loads((tree / 'infra/config/layers.json').read_text())
            config['devPortBase'] = dev - config['layers'][layer]['id']
            config['publicPortBase'] = public - config['layers'][layer]['id']
            (tree / 'infra/config/layers.json').write_text(json.dumps(config))
            run(['make', 'lane-env', 'LAYER=' + layer], tree)
        try:
            # Lecture/dispatch sur les cinq couches, sans démarrer leurs services.
            for command in (['lane-status'], ['lane-status', 'dashboard'], ['demands'], ['tasks'],
                            ['tasks', 'DEM-007']):
                run(['make', *command], repo)
            for layer in settings['layers']:
                for action in ('lane-up', 'lane-down', 'lane-logs', 'lane-rebuild'):
                    run(['make', '-n', action, layer], repo)
                    run(['make', '-n', action, 'LAYER=' + layer], repo)
            web = repo / 'worktree/web'
            web_file = web / 'infra/docker/docker-compose.dev.yml'
            web_file.write_text(web_file.read_text().replace('    build:\n',
                '    image: ' + json.dumps(args.image) + '\n    pull_policy: never\n    build:\n', 1)
)
            web_compose = ['docker', 'compose', '--project-directory', '.', '--env-file', 'webapp/.env',
                           '-f', 'infra/docker/docker-compose.dev.yml']
            stacks.append((web, web_compose))
            run(web_compose + ['run', '--rm', '--no-deps', 'webapp-localhost',
                               'bun', 'run', 'setup:local'], web)
            run(['make', 'lane-up', 'web'], repo)
            wait_http('http://127.0.0.1:' + str(ports['web'][0]) + '/fr', args.timeout)
            tree = repo / 'worktree/dashboard'
            compose_file = tree / 'infra/docker/docker-compose.dashboard-dev.yml'
            content = compose_file.read_text().replace('    build:\n', '    image: ' + json.dumps(args.image) + '\n    pull_policy: never\n    build:\n', 1)
            content = content.replace('image: nginx:1.27-alpine', 'image: ' + json.dumps(args.nginx_image) + '\n    pull_policy: never')
            # API désactivée : aucun appel Symfony extérieur.
            # Les API sont limitées au loopback ; Docker interne ne publie pas les ports ici.
            content = content.replace('      GD_TARGET: dashboard', '      GD_TARGET: dashboard\n      SYMFONY_API_URL: http://127.0.0.1:9\n      NUXT_SYMFONY_API_URL: http://127.0.0.1:9')
            content = content.replace('    build:\n      context: ./webapp\n      dockerfile: ../infra/docker/Dockerfile.dev\n', '')
            compose_file.write_text(content)
            compose = ['docker', 'compose', '--project-directory', '.', '--env-file', 'webapp/.env',
                       '-f', 'infra/docker/docker-compose.dashboard-dev.yml']
            stacks.append((tree, compose))
            run(['make', 'lane-up', 'dashboard'], repo)
            direct = 'http://127.0.0.1:' + str(ports['dashboard'][0])
            proxy = 'http://dashboard.wt-dashboard.localhost:' + str(ports['dashboard'][1])
            wait_http(direct + '/connexion', args.timeout)
            try:
                opener = build_opener(ProxyHandler({}))
                opener.open(Request('http://127.0.0.1:' + str(ports['dashboard'][1]),
                                    headers={'Host': 'unknown.localhost'}), timeout=10)
                raise RuntimeError('Hôte inconnu accepté')
            except HTTPError as error:
                assert error.code == 421
            before = run(compose + ['ps', '-q'], tree).splitlines()
            for marker, location, command in (
                    ('web', web, web_compose), ('dashboard', tree, compose)):
                run(command + ['exec', '-T', 'webapp-localhost', 'sh', '-c',
                    'mkdir -p /app/.data /app/node_modules/.cache; '
                    'echo ' + marker + ' > /app/.data/lane-smoke; '
                    'echo ' + marker + ' > /app/node_modules/.cache/lane-smoke'], location)
            for marker, location, command in (
                    ('web', web, web_compose), ('dashboard', tree, compose)):
                for destination in ('/app/.data/lane-smoke', '/app/node_modules/.cache/lane-smoke'):
                    assert run(command + ['exec', '-T', 'webapp-localhost', 'cat', destination], location) == marker

            script = Path(folder) / 'browser.cjs'
            script.write_text(BROWSER)
            result = run(['node', str(script), str(args.playwright_module.resolve()), direct, proxy,
                          str(tree / 'webapp/dashboard/app/components/dashboard/AccessForm.vue'),
                          str(args.chromium.resolve())], ROOT)
            assert before == run(compose + ['ps', '-q'], tree).splitlines(), 'Conteneurs recréés pendant HMR'
            logs = subprocess.Popen(['make', 'lane-logs', 'dashboard'], cwd=repo,
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                    start_new_session=True)
            try:
                time.sleep(1)
                assert logs.poll() is None, 'Le suivi des logs a échoué'
            finally:
                if logs.poll() is None:
                    os.killpg(logs.pid, signal.SIGINT)
                logs.wait(timeout=20)
            # Image locale explicite sans recette de build dans la fixture :
            # le dispatcher rebuild et la recréation sont exercés sans réseau.
            run(['make', 'lane-rebuild', 'dashboard'], repo)
            wait_http(direct + '/connexion', args.timeout)
            assert before != run(compose + ['ps', '-q'], tree).splitlines()
            run(['make', 'lane-down', 'dashboard'], repo)
            assert (tree / 'webapp/.data/dashboard/lane-smoke').read_text().strip() == 'dashboard'
            print(json.dumps({'base': base, 'browser': json.loads(result.splitlines()[-1]),
                              'containerIdsPreservedDuringHmr': True,
                              'fiveLayersDispatch': True, 'webDashboardIsolation': True,
                              'logsRebuildDown': True, 'unknownHost421': True, 'ports': ports['dashboard']}))
        finally:
            for tree, compose in reversed(stacks):
                run(compose + ['down', '--remove-orphans'], tree)


if __name__ == '__main__':
    main()
