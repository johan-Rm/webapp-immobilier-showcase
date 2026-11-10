#!/usr/bin/env python3
"""Sondes HTTP en lecture seule des trois vhosts SSR locaux."""
import argparse
import urllib.error
import urllib.request


def request(port, host, path):
    query = urllib.request.Request(f'http://127.0.0.1:{port}{path}', headers={'Host': host})
    try:
        with urllib.request.urlopen(query, timeout=15) as response:
            return response.status, response.read().decode('utf-8', errors='replace')
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode('utf-8', errors='replace')


def check(port):
    showcase = 'showcase-immobilier.localhost'
    client = 'client2-immobilier.localhost'
    for host, path, identity in [(showcase, '/fr', 'Showcase'),
                                 ('webapp.localhost', '/fr', 'Showcase'),
                                 (client, '/', 'Client 2 Immobilier')]:
        status, body = request(port, host, path)
        if status != 200 or identity not in body:
            raise ValueError(f'{host}{path} : identité SSR absente ou HTTP {status}')
    for path in ['/fr/dashboard/login', '/themes.json']:
        status, _ = request(port, showcase, path)
        if status != 200:
            raise ValueError(f'Showcase{path} : HTTP {status}')
        status, body = request(port, client, path)
        if status != 404 or ('Client 2 Immobilier' not in body and '404' not in body):
            raise ValueError(f'Client 2 expose une route Showcase : {path} (HTTP {status})')
    print('Trois vhosts SSR vérifiés ; routes Showcase absentes de Client 2.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    try:
        check(args.port)
    except (ValueError, OSError) as error:
        parser.exit(1, f'{error}\n')
