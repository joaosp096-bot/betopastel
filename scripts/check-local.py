"""Compiled Worker + D1 on Miniflare, without development file watchers."""
import subprocess,time,os,signal,urllib.request,urllib.error,tempfile
from pathlib import Path
Path('work').mkdir(exist_ok=True);port='8789';http=urllib.request.build_opener(urllib.request.ProxyHandler({}))
with tempfile.TemporaryDirectory(prefix='beto-test-',dir='work') as db:
 with open('work/local-test-server.log','w') as log:
  server=subprocess.Popen(['node','scripts/qa-runtime.mjs','integration',db],stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
  try:
   for _ in range(150):
    if server.poll() is not None:raise RuntimeError('Runtime saiu antes do teste; confira work/local-test-server.log')
    if 'QA_READY' in Path('work/local-test-server.log').read_text():break
    time.sleep(.2)
   else:raise RuntimeError('Runtime não iniciou')
   env=dict(os.environ);env['BETO_TEST_URL']='http://127.0.0.1:'+port;result=subprocess.run(['python3','tests/workflow.py'],env=env)
   if result.returncode:raise SystemExit(result.returncode)
   for path in ['/','/demonstracao','/images/pastel.png','/fonts/lato-400.ttf']:
    with http.open('http://127.0.0.1:'+port+path,timeout=15) as response:assert response.status==200,path
   print('PASS: Login, demonstração, imagem e fonte servidos pelo Worker')
  finally:
   os.killpg(server.pid,signal.SIGTERM);server.wait(timeout=10)
