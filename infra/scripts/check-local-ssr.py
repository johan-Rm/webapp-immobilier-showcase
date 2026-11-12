#!/usr/bin/env python3
"""Sondes HTTP en lecture seule des deux sites de la pile locale."""
import argparse
import urllib.error
import urllib.request

LAYERS = ('', 'web', 'bff', 'domaine', 'devops')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def request(port, host, path):
    query = urllib.request.Request(f'http://127.0.0.1:{port}{path}', headers={'Host': host})
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    try:
        with opener.open(query, timeout=15) as response:
            return response.status, response.read().decode('utf-8', errors='replace')
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode('utf-8', errors='replace')


def hosts(layer):
    if layer not in LAYERS:
        raise ValueError(f'Couche locale inconnue : {layer}')
    suffix = f'wt-{layer}' if layer else 'preprod'
    return f'showcase-immobilier.{suffix}.localhost', f'client2.{suffix}.localhost'


def check(port, layer='', dashboard=False):
    showcase, client = hosts(layer)
    for host, path, identity in [(showcase, '/fr', 'Showcase'),
                                 (client, '/', 'Client 2 Immobilier')]:
        for authority in (host, f'{host}:{port}'):
            status, body = request(port, authority, path)
            if status != 200 or identity not in body:
                raise ValueError(f'{authority}{path} : identité SSR absente ou HTTP {status}')
    for path in ['/en', '/es', '/fr/dashboard/login', '/themes.json']:
        status, _ = request(port, showcase, path)
        if status != 200:
            raise ValueError(f'Showcase{path} : HTTP {status}')
        status, body = request(port, client, path)
        if status != 404 or ('Client 2 Immobilier' not in body and '404' not in body):
            raise ValueError(f'Client 2 expose une route Showcase : {path} (HTTP {status})')
    if dashboard:
        dashboard_host = client.replace('client2.', 'dashboard.', 1)
        for authority in (dashboard_host, f'{dashboard_host}:{port}'):
            status, body = request(port, authority, '/connexion')
            if status != 200 or 'Connexion' not in body:
                raise ValueError(f'{authority}/connexion : identité dashboard absente ou HTTP {status}')
        for path in ['/fr/dashboard/login', '/themes.json']:
            status, _ = request(port, dashboard_host, path)
            if status != 404:
                raise ValueError(f'Dashboard expose une route Showcase : {path} (HTTP {status})')
    rejected = {'localhost', 'webapp.localhost', 'showcase-immobilier.localhost',
                'client2-immobilier.localhost', 'unknown.invalid'}
    for other in LAYERS:
        if other != layer:
            rejected.update(hosts(other))
            rejected.add(hosts(other)[1].replace('client2.', 'dashboard.', 1))
    for host in sorted(rejected):
        status, _ = request(port, host, '/fr')
        if status != 421:
            raise ValueError(f'Hôte non autorisé {host} : HTTP {status}, attendu 421')
    print(f'{layer or "preprod"}:{port} : {"trois cibles" if dashboard else "deux sites"} SSR, routes et refus des hôtes vérifiés.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8080)
    parser.add_argument('--layer', choices=LAYERS, default='')
    parser.add_argument('--dashboard', action='store_true', help='Vérifier aussi le dashboard de l’extension Compose')
    args = parser.parse_args()
    try:
        check(args.port, args.layer, args.dashboard)
    except (ValueError, OSError) as error:
        parser.exit(1, f'{error}\n')
