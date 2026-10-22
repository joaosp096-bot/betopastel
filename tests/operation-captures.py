"""Batched visual/accessibility evidence of the demo; no operational API writes."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
OUT=Path('.impeccable/review/operation');OUT.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width in [1440,390,320]:
  context=browser.new_context(viewport={'width':width,'height':1000 if width==1440 else 844},reduced_motion='reduce');page=context.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:8798/demonstracao');page.get_by_role('button',name='Conferir produção',exact=True).wait_for()
  def capture(name):
   page.evaluate('''async()=>{await document.fonts.ready;for(const i of document.images)if(i.offsetParent!==null)i.loading='eager';await Promise.all(Array.from(document.images).filter(i=>i.offsetParent!==null).map(i=>i.decode().catch(()=>{})));window.scrollTo(0,0)}''')
   page.wait_for_timeout(220)
   page.add_script_tag(path='/workspace/tools/a11y/node_modules/axe-core/axe.min.js')
   issues=page.evaluate('''async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))}''')
   file=f'{name}-{width}.png';page.screenshot(path=str(OUT/file),full_page=True)
   results.append({'file':file,'width':width,'overflow':page.evaluate('document.documentElement.scrollWidth>innerWidth'),'axe':issues,'errors':list(errors),'visibleInputs':page.locator('input:visible').count()})
   Path('work/captures-operation.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
   print(file,'issues',len(issues),'overflow',results[-1]['overflow'],flush=True)
  capture('inicio')
  page.get_by_role('button',name='Conferir produção',exact=True).click()
  if width!=320:capture('producao')
  row=page.locator('.ow-flavor:visible').first;row.locator('summary').first.click();capture('ajuste')
  if width==320:
   context.close();continue
  row.get_by_label('Produção nova',exact=True).fill('141');page.get_by_label('Quem participou?').fill('Robson, Erly');page.get_by_label('Massa batida (kg) · opcional').fill('50')
  page.get_by_role('button',name='Confirmar produção da semana').click();page.get_by_role('button',name='Consultar feiras',exact=True).wait_for()
  page.get_by_label('Simular dia').select_option('domingo');page.get_by_role('button',name='Consultar feiras',exact=True).click()
  page.get_by_role('button',name='Não sobrou nada',exact=True).click();page.get_by_role('button',name='Confirmar todas as sobras em zero').click();page.get_by_label('Margem por sabor e feira (opcional)').fill('2')
  row=page.locator('.ow-flavor:visible').first;row.locator('summary').first.click();row.get_by_label('Sobrou das feiras').fill('12')
  capture('fechamento')
  page.get_by_role('button',name='Confirmar fechamento',exact=True).click();page.get_by_text('Contagem salva',exact=True).filter(visible=True).wait_for();capture('resumo')
  context.close()
 browser.close()
assert not any(r['overflow'] or r['axe'] or r['errors'] for r in results),json.dumps(results,ensure_ascii=False)
print(json.dumps({'screens':len(results),'violations':0,'horizontalOverflow':0,'pageErrors':0}))
