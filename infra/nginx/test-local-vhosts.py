"""Vérifie les configurations locales sans lire les .env ni démarrer de site."""
import argparse
import time
import urllib.request
import urllib.error
import json
import os
import pathlib
import subprocess
import tempfile
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--showcase-image')
parser.add_argument('--client2-image')
args=parser.parse_args()
if bool(args.showcase_image) != bool(args.client2_image):
 parser.error('Les deux images SSR doivent être indiquées ensemble')
root=pathlib.Path(__file__).resolve().parents[2]
def run(*args, **kw):
 return subprocess.check_output(args, text=True, **kw)
with tempfile.TemporaryDirectory(prefix='dem004-config-') as tmp:
 p=pathlib.Path(tmp)
 (p/'env').write_text('SITE_URL=http://ancien.invalid\nPUBLIC_HOST=webapp.localhost\n')
 (p/'override.yml').write_text('services:\n  webapp-localhost:\n    env_file: !reset []\n  playwright:\n    env_file: !reset []\n  webapp-ssr:\n    env_file: !reset []\n')
 for layer,port,dev in [('',8080,3000),('web',19401,19301),('bff',19402,19302),('domaine',19403,19303),('devops',19404,19304)]:
  env={**os.environ,'AIDE_LAYER':layer,'PUBLIC_PORT':str(port),'WEBAPP_DEV_PORT':str(dev)}
  config=json.loads(run('docker','compose','--project-directory',str(root),'--env-file',str(p/'env'),'-f','infra/docker/docker-compose.dev.yml','-f',str(p/'override.yml'),'config','--format','json',env=env))['services']
  suffix='wt-'+layer if layer else 'preprod'
  for service,site in [('webapp-ssr','showcase-immobilier'),('client2-ssr','client2')]:
   url=f'http://{site}.{suffix}.localhost:{port}'
   assert config[service]['build']['args']['SITE_URL']==url
   assert config[service]['environment']['SITE_URL']==url
   assert config[service]['environment']['PUBLIC_HOST']==f'{site}.{suffix}.localhost'
  assert config['webapp-localhost']['ports'][0]['published']==str(dev)
  assert config['nginx']['ports'][0]['published']==str(port)
  print('Compose OK:',suffix,port,dev)
for layer in ['', 'web', 'bff', 'domaine', 'devops']:
 run('docker', 'run', '--rm', '-e', 'AIDE_LAYER='+layer,
     '-v', str(root/'infra/nginx/vhost.conf')+':/opt/local-vhost.conf:ro',
     '-v', str(root/'infra/nginx/19-local-vhosts.sh')+':/docker-entrypoint.d/19-local-vhosts.sh:ro',
     'nginx:1.27-alpine', 'nginx', '-t')
 print('Nginx syntax OK:', layer or 'preprod')
result=subprocess.run(['docker', 'run', '--rm', '--entrypoint', '/bin/sh',
    '-e', 'AIDE_LAYER=unknown', '-v',
    str(root/'infra/nginx/19-local-vhosts.sh')+':/check.sh:ro',
    'nginx:1.27-alpine', '/check.sh'], capture_output=True, text=True)
assert result.returncode != 0 and 'Couche locale inconnue' in result.stderr
print('Unknown layer refused OK')

if not args.showcase_image:
 raise SystemExit(0)
network='dem004-ops008-'+str(os.getpid())
containers=[]
try:
 run('docker','network','create',network)
 for name,image in [('webapp-ssr',args.showcase_image),('client2-ssr',args.client2_image)]:
  container=network+'-'+name
  run('docker','run','-d','--name',container,'--network',network,'--network-alias',name,'--entrypoint','node',image,'.output/server/index.mjs')
  containers.append(container)
 nginx=network+'-nginx'
 run('docker','run','-d','--name',nginx,'--network',network,'-p','127.0.0.1::80','-e','AIDE_LAYER=devops','-v',str(root/'infra/nginx/vhost.conf')+':/opt/local-vhost.conf:ro','-v',str(root/'infra/nginx/19-local-vhosts.sh')+':/docker-entrypoint.d/19-local-vhosts.sh:ro','nginx:1.27-alpine')
 containers.append(nginx)
 port=run('docker','port',nginx,'80').strip().rsplit(':',1)[1]
 def request(host,path='/'):
  req=urllib.request.Request('http://127.0.0.1:'+port+path,headers={'Host':host})
  try:
   with urllib.request.urlopen(req,timeout=10) as response:return response.status,response.read().decode()
  except urllib.error.HTTPError as e:return e.code,e.read().decode()
 for attempt in range(30):
  try:
   if request('showcase-immobilier.wt-devops.localhost','/fr')[0]==200:break
  except OSError:pass
  time.sleep(1)
 else:raise AssertionError('SSR not ready')
 print(run('docker','exec',nginx,'nginx','-t').strip())
 for host,path,identity in [('showcase-immobilier.wt-devops.localhost','/fr','Showcase'),('client2.wt-devops.localhost','/','Client 2 Immobilier')]:
  for authority in [host,host+':19404']:
   status,body=request(authority,path)
   assert status==200 and identity in body,(authority,status)
   print('HTTP identity OK:',authority)
 for host in ['localhost','webapp.localhost','showcase-immobilier.localhost','client2-immobilier.localhost','unknown.invalid','showcase-immobilier.preprod.localhost','client2.wt-web.localhost']:
  status,_=request(host)
  assert status==421,(host,status)
  print('HTTP refusal OK:',host,status)
 # Unknown layers must fail before serving anything.
 result=subprocess.run(['docker','run','--rm','--entrypoint','/bin/sh','-e','AIDE_LAYER=unknown','-v',str(root/'infra/nginx/19-local-vhosts.sh')+':/check.sh:ro','nginx:1.27-alpine','/check.sh'],capture_output=True,text=True)
 assert result.returncode!=0 and 'Couche locale inconnue' in result.stderr
 print('Unknown layer refused OK')
finally:
 for container in reversed(containers):subprocess.run(['docker','rm','-f',container],stdout=subprocess.DEVNULL,check=True)
 subprocess.run(['docker','network','rm',network],stdout=subprocess.DEVNULL,check=True)
