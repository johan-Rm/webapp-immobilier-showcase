"""Configuration Dashboard résolue avec un environnement fictif, sans daemon."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


class DashboardComposition(unittest.TestCase):
    def test_resolved_compose_is_dashboard_only_and_worktree_local(self):
        with tempfile.TemporaryDirectory() as folder:
            directory = Path(folder)
            (directory / 'env').write_text('')
            (directory / 'override.yml').write_text(
                'services:\n  webapp-localhost:\n    env_file: !reset []\n')
            environment = {k: v for k, v in os.environ.items()
                           if k not in ('COMPOSE_FILE', 'COMPOSE_PROJECT_NAME', 'GD_TARGET',
                                        'PUBLIC_PORT', 'WEBAPP_DEV_PORT', 'SCHEMAS_PATH')}
            result = subprocess.check_output([
                'docker', 'compose', '--project-directory', str(ROOT),
                '--env-file', str(directory / 'env'), '-f',
                'infra/docker/docker-compose.dashboard-dev.yml', '-f',
                str(directory / 'override.yml'), 'config', '--format', 'json'],
                env=environment, text=True)
        services = json.loads(result)['services']
        self.assertEqual(set(services), {'nginx', 'webapp-localhost'})
        app = services['webapp-localhost']
        self.assertEqual(app['environment']['GD_TARGET'], 'dashboard')
        self.assertIn('/connexion', ' '.join(app['healthcheck']['test']))
        volumes = {v['target']: v for v in app['volumes']}
        for target in ('/app/dashboard', '/app/.data', '/app/.nuxt', '/app/.output',
                       '/app/node_modules/.cache'):
            self.assertTrue(volumes[target]['source'].startswith(str(ROOT / 'webapp') + '/'))
        self.assertTrue(volumes['/opt/app-schemas']['read_only'])
        self.assertTrue(volumes['/app/.data']['source'].endswith('/.data/dashboard'))
        self.assertEqual(services['nginx']['ports'][0]['published'], '19405')
        self.assertEqual(services['nginx']['environment']['NGINX_ENVSUBST_FILTER'], '^DASHBOARD_HOST')
        proxy = (ROOT / 'infra/nginx/dashboard-dev.conf.template').read_text()
        self.assertIn('proxy_set_header Upgrade $http_upgrade;', proxy)
        self.assertIn('proxy_set_header Host $http_host;', proxy)
        self.assertIn('return 421;', proxy)
        self.assertNotIn('immutable', proxy)


class DashboardProxy(unittest.TestCase):
    @unittest.skipUnless(os.environ.get('AIDE_NGINX_SMOKE') == '1',
                         'Docker daemon et smoke explicite requis')
    def test_proxy_http_and_websocket_without_application(self):
        from pathlib import Path
        import subprocess,tempfile,os,http.client,json
        root=ROOT
        name='ops019-probe-'+str(os.getpid())
        def run(*args):
         return subprocess.check_output(['docker',*args],text=True).strip()
        with tempfile.TemporaryDirectory(prefix='ops019-nginx-') as folder:
         path=Path(folder)/'backend.conf'
         path.write_text('''server { listen 3000;
         location / { add_header X-Received-Host $http_host always; return 200 "fixture"; }
         location /ws { add_header Upgrade websocket always; add_header Connection upgrade always; return 101; }
         }''')
         backend=name+'-backend'; proxy=name+'-proxy'
         try:
          run('network','create',name)
          run('run','-d','--name',backend,'--network',name,'--network-alias','webapp-localhost','-v',str(path)+':/etc/nginx/conf.d/default.conf:ro','nginx:1.27-alpine')
          run('run','-d','--name',proxy,'--network',name,'-p','127.0.0.1::80','-e','DASHBOARD_HOST=dashboard.wt-dashboard.localhost','-e','NGINX_ENVSUBST_FILTER=^DASHBOARD_HOST','-v',str(root/'infra/nginx/dashboard-dev.conf.template')+':/etc/nginx/templates/default.conf.template:ro','nginx:1.27-alpine')
          import time
          for attempt in range(30):
           try:
            run('exec',proxy,'nginx','-t');break
           except subprocess.CalledProcessError:
            time.sleep(.2)
          port=int(json.loads(run('inspect',proxy))[0]['NetworkSettings']['Ports']['80/tcp'][0]['HostPort'])
          def request(host,route='/',headers=None):
           connection=http.client.HTTPConnection('127.0.0.1',port,timeout=5)
           connection.request('GET',route,headers={'Host':host,**(headers or {})})
           response=connection.getresponse();status=response.status; result=dict(response.getheaders());connection.close();return status,result
          assert request('other.localhost')[0]==421
          status,headers=request('dashboard.wt-dashboard.localhost:19405','/_nuxt/probe.js')
          assert status==200 and headers['X-Received-Host']=='dashboard.wt-dashboard.localhost:19405'
          assert 'immutable' not in headers.get('Cache-Control','')
          assert request('dashboard.wt-dashboard.localhost','/ws',{'Upgrade':'websocket','Connection':'Upgrade'})[0]==101
          print('Nginx -t, Host avec port conservé, hôte inconnu 421, Upgrade 101 et absence de cache immutable : OK.')
         finally:
          for container in (proxy,backend):
           subprocess.run(['docker','rm','-f',container],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
          subprocess.run(['docker','network','rm',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)


if __name__ == '__main__':
    unittest.main()
