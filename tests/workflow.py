"""Integration tests run only against check-local.py's temporary D1."""
import json,uuid,urllib.request,urllib.error,concurrent.futures,os,datetime
BASE=os.environ['BETO_TEST_URL'];assert BASE.startswith('http://127.0.0.1:'),'QA exige ambiente local isolado';http=urllib.request.build_opener(urllib.request.ProxyHandler({}));checks=[]
def call(path='/api/state',method='GET',body=None,cookie=None,origin=True,ip='203.0.113.1',extra=None):
 headers={'cf-connecting-ip':ip}
 if cookie:headers['Cookie']=cookie
 if body is not None:headers['Content-Type']='application/json'
 if origin is True and method!='GET':headers['Origin']=BASE
 elif isinstance(origin,str):headers['Origin']=origin
 if extra:headers.update(extra)
 req=urllib.request.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
 try:
  with http.open(req,timeout=30) as r:return r.status,json.load(r),dict(r.headers)
 except urllib.error.HTTPError as e:
  raw=e.read()
  try:data=json.loads(raw)
  except json.JSONDecodeError:data={'nonJson':raw.decode(errors='replace')[:300]}
  code=e.code;headers=dict(e.headers);e.close()
  return code,data,headers
def check(ok,label):assert ok,label;checks.append(label);print('PASS:',label)
def login(email='admin@example.test',password='qa-secret-2026',ip='203.0.113.1'):
 code,d,h=call('/api/auth/login','POST',{'email':email,'password':password},ip=ip);assert code==200,(code,d)
 return h['Set-Cookie'].split(';')[0],h
code,d,h=call();check(code==401,'API anônima protegida')
code,d,h=call(extra={'oai-authenticated-user-id':'qa-admin'});check(code==401,'Identidade oai forjada não autentica')
code,d,h=call('/api/auth/session');check(code==200 and d['configured'] and d['user'] is None,'Bootstrap local cria acesso configurado sem expor identidade')
code,_,_=call('/api/auth/login','POST',{'email':'admin@example.test','password':'wrong'},origin='https://externo.test');check(code==403,'Login rejeita origem externa')
code,err,h=call('/api/auth/login','POST',{'email':'admin@example.test','password':'wrong'},origin=False);check(code==403,'Login exige origem '+str((code,err)))
code,_,_=call('/api/auth/login','POST',{'email':'unknown@example.test','password':'qa-secret-2026'});check(code==401,'E-mail desconhecido recebe erro genérico')
code,_,_=call('/api/auth/login','POST',{'email':'admin@example.test','password':'wrong'});check(code==401,'Senha errada não abre sessão')
admin,headers=login();cookie=headers['Set-Cookie'];check(all(v in cookie for v in ['__Host-beto_session','HttpOnly','Secure','SameSite=Lax','Path=/']),'Cookie próprio protegido, exclusivo do Beto')
code,d,_=call('/api/auth/session',cookie=admin);check(d['user']['role']=='admin','Sessão identifica administrador no servidor')
code,state,_=call(cookie=admin);check(code==200 and state['version']==0 and len(state['state']['flavors'])==19,'Banco vazio inicia sem registros fictícios')
code,d,_=call('/api/users','PUT',{'name':'Erly QA','email':'erly@example.test','role':'operador','active':True,'password':'qa-operator-2026'},admin);check(code==200,'Administrador cria acesso independente da operação')
operator,_=login('erly@example.test','qa-operator-2026',ip='203.0.113.2')
code,d,_=call('/api/users',cookie=operator);check(code==403,'Operador não lista gestão de acessos')
code,d,_=call('/api/users',cookie=admin);check(code==200 and all('password_hash' not in u for u in d['users']),'Resposta nunca expõe hash de senha')
# Previous week allows deterministic return tests regardless of current weekday.
local=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).date();start=local-datetime.timedelta(days=(local.weekday()-2)%7+7)
version=0
def write(op,cookie=admin,requestid=None,expected=None):
 global version,state
 code,d,h=call('/api/state','PUT',{'operation':op,'version':version,'requestId':requestid or str(uuid.uuid4())},cookie)
 if expected is None:assert code==200,(code,d);version=d['version'];state=d
 else:assert code==expected,(code,d)
 return code,d,h
write({'kind':'round','start':str(start),'productionDay':str(start)});r=state['state']['rounds'][0];rid=r['id'];fid=state['state']['flavors'][0]['id'];friday=r['fairs'][0]['id']
code,d,_=call(cookie=operator);check(code==200 and d['state']==state['state'],'Equipe compartilha registros do estabelecimento')
write({'kind':'settings','settings':state['state']['settings']},operator,expected=400);check(True,'Papel no servidor impede configuração por operador')
code,_,_=call('/api/state','PUT',{'state':state['state'],'version':version,'requestId':str(uuid.uuid4()),'role':'admin'},operator);check(code==400,'Cliente não substitui estado nem declara papel')
op={'kind':'production','roundId':rid,'flavorId':fid,'day':str(start),'planned':100,'produced':80}
_,a,_=write(op,operator);record=a['receipt'];_,b,_=write({**op,'produced':90},operator)
check(b['receipt']['id']==record['id'] and b['receipt']['revision']==2 and b['state']['rounds'][0]['production'][0]['produced']==90,'Correção antes de concluir substitui contagem, com autoria real')
check(b['receipt']['savedBy']=='Erly QA','Autor definido pela sessão, não pelo formulário')
expense={'kind':'expense','roundId':rid,'fairId':friday,'date':str(start),'category':'Insumos','description':'Massa QA','amount':23000};reqid=str(uuid.uuid4());oldversion=version
_,v,_=write(expense,operator,reqid);_,v,_=write({**expense,'description':'Óleo QA'})
code,idem,_=call('/api/state','PUT',{'operation':expense,'version':oldversion,'requestId':reqid},operator)
check(code==200 and idem.get('idempotent') and idem['version']==version and len(idem['state']['expenses'])==2,'Reenvio não duplica e retorna versão atual')
code,_,_=call('/api/state','PUT',{'operation':{**expense,'description':'Outra despesa'},'version':version,'requestId':reqid},operator);check(code==409,'Mesmo ID não aceita operação diferente')
code,_,_=call('/api/state','PUT',{'operation':expense,'version':oldversion,'requestId':str(uuid.uuid4())},admin);check(code==409,'Versão antiga não sobrescreve equipe')
code,_,_=call('/api/state','PUT',{'operation':expense,'version':version,'requestId':str(uuid.uuid4())},admin,origin='https://externo.test');check(code==403,'Origem externa não grava')
def parallel(i):
 result=call('/api/state','PUT',{'operation':{**expense,'description':'Concorrente '+str(i)},'version':version,'requestId':str(uuid.uuid4())},[admin,operator][i]);return (result[0],result[1])
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(parallel,[0,1]))
check(sorted(x[0] for x in results)==[200,409],'Concorrência atômica: uma gravação e um conflito '+str([(x[0],x[1].get('error',x[1].get('nonJson','ok'))) for x in results]))
_,state,_=call(cookie=admin);version=state['version'];check(len(state['audit'])==version and len(state['state']['expenses'])==3,'Conflito não cria revisão fantasma')
write({**expense,'amount':1.5},expected=400);check(True,'Dinheiro exige centavos inteiros')
flavors=state['state']['flavors'];flavors[0]['prices']={'sexta':1200,'sabado':1400,'domingo':1600};write({'kind':'catalog','flavors':flavors})
for flavor in state['state']['flavors']:
 if flavor['prepKind']=='base':
  if flavor['id']!=fid:write({**op,'flavorId':flavor['id'],'produced':0})
  write({'kind':'allocation','roundId':rid,'flavorId':flavor['id'],'day':str(start),'correction':True,'reason':'Registro histórico QA','allocations':[{'fairId':f['id'],'quantity':10 if flavor['id']==fid else 0} for f in state['state']['rounds'][0]['fairs']]})
write({'kind':'seal-production','roundId':rid,'day':str(start)});check(state['state']['rounds'][0]['productionClosed'],'Produção única conclui no D1')
check([f['lines'][0]['price'] for f in state['state']['rounds'][0]['fairs']]==[1200,1400,1600],'Preço por feira persistido nas cargas')
for fair in state['state']['rounds'][0]['fairs']:
 required=[line for line in fair['lines'] if line['taken']>0 or any(f['id']==line['flavorId'] and f['prepKind']=='na_feira' for f in state['state']['flavors'])]
 for line in required:write({'kind':'return','roundId':rid,'fairId':fair['id'],'flavorId':line['flavorId'],'returned':0,'reusable':0,'loss':0,'adjustment':0,'soldOut':False},operator)
 write({'kind':'seal-return','roundId':rid,'fairId':fair['id']},operator)
write({'kind':'close-round','roundId':rid},operator);check(state['state']['rounds'][0]['status']=='concluida','Operação encerrada sem exigir caixa no banco real local')
write({'kind':'cash','roundId':rid,'fairId':friday,'float':10000,'cash':35000,'pix':10000,'card':8000,'withdrawal':5000},operator);check(state['state']['rounds'][0]['fairs'][0]['cash']['closed'],'Caixa posterior persiste na rodada encerrada')
code,history,_=call('/api/history?version=1',cookie=operator);check(code==200 and history['state']['rounds'][0]['production'][0]['produced']==0,'Histórico retorna estado anterior preservado')
code,_,_=call('/api/history?version=1');check(code==401,'Histórico também protegido por sessão')
# Optional receipt storage is isolated from workspace snapshots and always authenticated.
import base64
_,v,_=write({'kind':'expense','date':str(local),'category':'Insumos','description':'Gás sem rodada QA','amount':12000,'status':'pendente'})
eid=v['receipt']['values']['after']['id']
check(v['receipt']['values']['after']['roundId']=='','Gasto salva sem rodada e sem nota')
code,_,_=call('/api/receipts?expenseId='+eid);check(code==401,'Comprovantes exigem sessão própria')
png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jq4kAAAAASUVORK5CYII=')
def upload_receipt(data=png,expense=eid,mime='image/png',cookie=admin,origin=None):
 boundary='beto-qa-boundary';body=(('--'+boundary+'\r\nContent-Disposition: form-data; name="expenseId"\r\n\r\n'+expense+'\r\n--'+boundary+'\r\nContent-Disposition: form-data; name="file"; filename="nota-qa.png"\r\nContent-Type: '+mime+'\r\n\r\n').encode()+data+('\r\n--'+boundary+'--\r\n').encode())
 req=urllib.request.Request(BASE+'/api/receipts',data=body,method='POST',headers={'Content-Type':'multipart/form-data; boundary='+boundary,'Origin':origin or BASE,'Cookie':cookie})
 try:
  with http.open(req,timeout=15) as res:return res.status,json.load(res)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
code,file=upload_receipt();check(code==201,'Nota opcional é armazenada de forma privada no D1 '+str(file.get('error','')))
code,files,_=call('/api/receipts?expenseId='+eid,cookie=admin);check(code==200 and len(files['files'])==1 and 'body' not in files['files'][0],'Lista de comprovantes contém metadados e autoria, sem conteúdo')
req=urllib.request.Request(BASE+'/api/receipts?id='+file['id'],headers={'Cookie':admin})
with http.open(req,timeout=15) as res:check(res.read()==png and res.headers['Cache-Control']=='private, no-store','Arquivo privado mantém bytes e cabeçalhos corretos')
code,_,_=call('/api/receipts?id='+file['id']);check(code==401,'URL do comprovante não abre sem sessão')
code,_=upload_receipt(b'<script>alert(1)</script>');check(code==415,'Conteúdo disfarçado de imagem é recusado')
code,_=upload_receipt(expense='inexistente');check(code==400,'Não anexa em gasto inexistente')
code,_=upload_receipt(origin='https://externo.test');check(code==403,'Origem externa não anexa comprovante')
code,error=upload_receipt(data=png+b'0'*(768*1024));check(code==400 and '768' in error.get('error',''),'Arquivo maior que 768 KB é recusado antes de armazenar')
more=[upload_receipt()[0] for _ in range(3)];check(more==[201,201,400],'Limite de três comprovantes por gasto é aplicado no banco')
write({'kind':'expense-payment','expenseId':eid,'date':str(local)})
check(len([e for e in state['state']['expenses'] if e['id']==eid])==1 and next(e for e in state['state']['expenses'] if e['id']==eid)['status']=='pago','Pagamento mantém um único gasto no banco')
code,historypage,_=call('/api/history',cookie=admin)
check(code==200 and len(historypage['revisions'])==40 and all('payload' not in r for r in historypage['revisions']),'Histórico pagina metadados sem carregar snapshots completos')
code,older,_=call('/api/history?before='+str(historypage['nextBefore']),cookie=admin)
check(code==200 and older['revisions'] and not set(r['version'] for r in older['revisions']) & set(r['version'] for r in historypage['revisions']),'Histórico anterior acessível sem sobrepor páginas')
code,_,_=call('/api/history');check(code==401,'Lista paginada também exige sessão')
code,_,_=call('/api/auth/logout','POST',cookie=operator);check(code==200,'Logout confirma revogação')
code,_,_=call(cookie=operator);check(code==401,'Cookie revogado não acessa mais dados')
operator,_=login('erly@example.test','qa-operator-2026',ip='203.0.113.3')
code,_,_=call('/api/auth/password','POST',{'currentPassword':'qa-operator-2026','password':'qa-new-secret-2026'},operator);check(code==200,'Troca de senha revoga sessões anteriores')
code,_,_=call(cookie=operator);check(code==401,'Sessão antiga falha após troca da senha')
operator,_=login('erly@example.test','qa-new-secret-2026',ip='203.0.113.4');check(bool(operator),'Nova senha abre sessão')
for _ in range(11):code,_,h=call('/api/auth/login','POST',{'email':'wrong@example.test','password':'wrong'},ip='203.0.113.99')
check(code==429 and 'Retry-After' in h,'Tentativas excessivas recebem limite compartilhado no D1')
print(json.dumps({'passed':len(checks),'final_version':version}))
