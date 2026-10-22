"""Real browser, only the local QA Worker. No production data or accounts."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json, datetime, os

BASE = os.environ.get('BETO_TEST_URL', 'http://127.0.0.1:8798')
assert BASE.startswith('http://127.0.0.1:'), 'Local QA only'
checks=[]
def check(value, name):
 assert value,name
 checks.append(name); print('PASS:',name,flush=True)
def api(page, path='/api/state', method='GET', body=None):
 return page.evaluate('''async ({path,method,body})=>{const r=await fetch(path,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}}''',dict(path=path,method=method,body=body))
def write(page, op):
 state=api(page)['data']; res=api(page,method='PUT',body={'version':state['version'],'requestId':page.evaluate('crypto.randomUUID()'),'operation':op})
 assert res['status']==200,res
 return res['data']
def visible(page, selector): return page.locator(selector+':visible')

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000});page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE)
 login=api(page,'/api/auth/login','POST',{'email':'admin@example.test','password':'qa-secret-2026'})
 check(login['status']==200,'Login local abre sessão própria')
 current=api(page)['data'];s=current['state'];flavors=s['flavors']
 for f in flavors:
  f['active']=f['id'] in ['sabor-3','sabor-14'];f['prices']={'sexta':1000,'sabado':1200,'domingo':1500}
 write(page,{'kind':'catalog','flavors':flavors})
 write(page,{'kind':'production-template','lines':[{'flavorId':f['id'],'quantity':110 if f['prepKind']=='base' else 6,'allocations':{'sexta':30,'sabado':30,'domingo':40} if f['prepKind']=='base' else {'sexta':2,'sabado':2,'domingo':2}} for f in flavors if f['active']]})
 now=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).date();start=now-datetime.timedelta(days=(now.weekday()-2)%7+7)
 state=write(page,{'kind':'round','start':str(start),'methodology':'weekly-allocation-v2'});rid=state['state']['rounds'][-1]['id']
 page.reload();page.get_by_role('button',name='Conferir produção',exact=True).click()
 page.get_by_label('Quem participou?').fill('Robson, Erly')
 row=page.locator('.ow-flavor:visible').filter(has=page.get_by_text('Carne',exact=True)).first
 row.locator('summary').first.click();row.get_by_label('Produção nova',exact=True).fill('115')
 page.wait_for_timeout(250);page.reload();page.get_by_role('button',name='Recuperar rascunho',exact=True).click()
 row=page.locator('.ow-flavor:visible').filter(has=page.get_by_text('Carne',exact=True)).first;row.locator('summary').first.click()
 check(page.get_by_label('Quem participou?').input_value()=='Robson, Erly' and row.get_by_label('Produção nova',exact=True).input_value()=='115','Recarga recupera colaboradores e edição de um sabor')
 # Concurrent user changes the saved week while this form is dirty.
 write(page,{'kind':'week-fair','roundId':rid,'key':'sexta','cancelled':False,'note':'Contexto registrado por outra sessão'})
 page.get_by_role('button',name='Confirmar produção da semana').click();page.wait_for_timeout(400)
 check('115'==row.get_by_label('Produção nova',exact=True).input_value(),'Conflito mantém o preenchimento')
 page.reload();page.get_by_role('button',name='Recuperar rascunho',exact=True).click()
 check(page.get_by_text('Os registros mudaram desde este rascunho.',exact=True).is_visible(),'Rascunho antigo exige conferência contra nova versão')
 page.get_by_role('button',name='Conferi os dados atuais',exact=True).click()
 # Simulated temporary network failure; retry must keep values and same mutation semantics.
 page.route('**/api/state',lambda route: route.abort() if route.request.method=='PUT' else route.continue_())
 page.get_by_role('button',name='Confirmar produção da semana').click();page.wait_for_timeout(400)
 check(page.get_by_label('Quem participou?').input_value()=='Robson, Erly' and 'conexão' in page.locator('.formerror:visible').inner_text(),'Falha de rede mantém colaboradores e mostra recuperação')
 page.unroute('**/api/state')
 # Explicit local session expiry, then the existing reauthentication overlay.
 api(page,'/api/auth/logout','POST')
 page.get_by_role('button',name='Confirmar produção da semana').click()
 dialog=page.get_by_role('dialog');dialog.wait_for()
 check(page.get_by_label('Quem participou?').input_value()=='Robson, Erly','Sessão expirada mantém o formulário montado')
 dialog.locator('input[type=email]').fill('admin@example.test');dialog.locator('input[type=password]').fill('qa-secret-2026');dialog.get_by_role('button',name='Entrar',exact=True).click();dialog.wait_for(state='hidden')
 page.get_by_role('button',name='Confirmar produção da semana').click()
 page.get_by_role('heading',name='Produção confirmada',exact=True).wait_for()
 confirmed=api(page)['data'];week=confirmed['state']['rounds'][-1]
 check(week['production'][next(i for i,x in enumerate(week['production']) if x['flavorId']=='sabor-3')]['produced']==115,'Retry salva uma produção de 115 após autenticar')
 check(len([x for x in confirmed['state']['records'] if x['key']=='week-prepare|'+rid])==1,'Rede e autenticação não duplicam confirmação')
 page.get_by_role('button',name='Consultar feiras',exact=True).click()
 page.get_by_role('button',name='Não sobrou nada',exact=True).click()
 check(page.get_by_role('button',name='Confirmar todas as sobras em zero').is_visible(),'Zero em lote pede confirmação explícita')
 page.get_by_role('button',name='Confirmar todas as sobras em zero').click();page.get_by_label('Margem por sabor e feira (opcional)').fill('2')
 page.get_by_role('button',name='Confirmar fechamento',exact=True).click();page.get_by_text('Contagem salva',exact=True).filter(visible=True).wait_for()
 page.reload();page.get_by_text('Contagem salva',exact=True).filter(visible=True).wait_for();check(True,'Fechamento persiste após recarregar')
 state=api(page)['data'];week=state['state']['rounds'][-1]
 check(week['operation']['closing']['extras'][0]['values']['sexta']['quantity'] is None,'Fechamento não exige nem inventa extras')
 check(not errors,'Sem erros JavaScript no fluxo autenticado: '+str(errors))
 Path('work/browser-operation.json').write_text(json.dumps({'checks':checks,'pageErrors':errors},ensure_ascii=False,indent=2))
 browser.close()
