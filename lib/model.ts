import { z } from 'zod';
const id=z.string().min(1).max(80), qty=z.number().int().min(0).max(1000000), money=z.number().int().min(0).max(100000000), date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,'Data inválida');
export const flavorSchema=z.object({id,name:z.string().trim().min(1).max(80),price:money,active:z.boolean(),prepKind:z.enum(['base','na_feira']).default('base'),prices:z.record(money).default({})});
const lineSchema=z.object({flavorId:id,planned:qty,taken:qty,returned:qty,reusable:qty,loss:qty,adjustment:z.number().int().min(-1000000).max(1000000),soldOut:z.boolean(),price:money});
const fairSchema=z.object({id,scheduleKey:z.enum(['sexta','sabado','domingo']).nullable().default(null),name:z.string().trim().min(1).max(100),date,status:z.enum(['planejada','em_feira','retorno']),lines:z.array(lineSchema).max(100),team:z.string().max(200),transport:z.string().max(200),notes:z.string().max(500),startTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().default(null),closeTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().default(null),loadConfirmed:z.boolean().default(false),returnSealed:z.boolean().default(false),cash:z.object({closed:z.boolean(),float:money,cash:money,pix:money,card:money,withdrawal:money})});
const roundSchema=z.object({id,start:date,end:date,status:z.enum(['aberta','concluida']),productionDay:date.nullable().default(null),productionClosed:z.boolean().default(false),legacyProduction:z.boolean().default(true),production:z.array(z.object({flavorId:id,planned:qty,produced:qty})).max(100),fairs:z.array(fairSchema).max(50)}).refine(v=>v.end>=v.start,'Data final anterior à inicial');
const expenseSchema=z.object({id,roundId:id,fairId:z.string().max(80),date,category:z.enum(['Insumos','Equipe','Transporte','Outros']),description:z.string().trim().min(1).max(200),amount:money});
export const recordSchema=z.object({id,key:z.string().max(240),kind:z.enum(['production','allocation','return','cash','seal']),roundId:id,fairId:z.string().max(80),flavorId:z.string().max(80),day:date,savedAt:z.string().max(50),savedBy:z.string().max(100),revision:z.number().int().min(1),values:z.record(z.unknown())});
const schedule=z.object({key:z.enum(['sexta','sabado','domingo']),name:z.string().max(100),region:z.string().max(160),offset:z.number().int().min(0).max(6),startTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),closeTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable()});
export const defaultSettings=()=>({timezone:'America/Sao_Paulo' as const,schedules:[{key:'sexta' as const,name:'Feira dos Amarais',region:'Santa Mônica / Chácara dos Amarais',offset:2,startTime:null,closeTime:null},{key:'sabado' as const,name:'Feira de Nova Odessa',region:'Nova Odessa',offset:3,startTime:null,closeTime:null},{key:'domingo' as const,name:'Feira de Morungaba',region:'Morungaba',offset:4,startTime:null,closeTime:null}]});
export const stateSchema=z.object({records:z.array(recordSchema).max(20000).default([]),settings:z.object({timezone:z.literal('America/Sao_Paulo'),schedules:z.array(schedule).length(3)}).default(defaultSettings),flavors:z.array(flavorSchema).min(1).max(100),rounds:z.array(roundSchema).max(200),expenses:z.array(expenseSchema).max(3000)}).superRefine((s,c)=>{
 const fail=(message:string)=>c.addIssue({code:'custom',message});
 const unique=(items:{id:string}[])=>new Set(items.map(v=>v.id)).size===items.length;
 if(!unique(s.flavors)||!unique(s.rounds)||!unique(s.expenses)||!unique(s.records)||new Set(s.records.map(v=>v.key)).size!==s.records.length)fail('Identificadores duplicados');
 const flavors=new Set(s.flavors.map(v=>v.id)), rounds=new Set(s.rounds.map(v=>v.id));
 const allFairs=new Set<string>();
 for(const r of s.rounds){
  if(!unique(r.fairs))fail('Feira duplicada');
  if(new Set(r.production.map(v=>v.flavorId)).size!==r.production.length)fail('Produção duplicada');
  for(const p of r.production)if(!flavors.has(p.flavorId))fail('Sabor inexistente');
  for(const f of r.fairs){
   if(r.legacyProduction&&f.status==='retorno')f.returnSealed=true;
   if(allFairs.has(f.id))fail('Feira duplicada');allFairs.add(f.id);
   if(f.date<r.start||f.date>r.end)fail('A feira deve estar dentro da rodada');
   if(f.status==='planejada'&&f.cash.closed)fail('Feira ainda não realizada');
   if(new Set(f.lines.map(v=>v.flavorId)).size!==f.lines.length)fail('Sabor duplicado');
   for(const l of f.lines){if(!flavors.has(l.flavorId))fail('Sabor inexistente');if(l.reusable>l.returned)fail('Reaproveitamento maior que o retorno');}
  }
  if(r.status==='concluida'&&r.fairs.some(f=>!f.returnSealed))fail('Há retorno pendente');
 }
 for(const e of s.expenses){if(!rounds.has(e.roundId))fail('Rodada inexistente');if(e.fairId&&!s.rounds.find(r=>r.id===e.roundId)?.fairs.some(f=>f.id===e.fairId))fail('Feira inexistente');}
});
export type State=z.infer<typeof stateSchema>;export type Flavor=State['flavors'][number];export type Round=State['rounds'][number];export type Fair=Round['fairs'][number];export type Line=Fair['lines'][number];
export const uid=()=>crypto.randomUUID();
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function addDays(d:string,n:number){const a=new Date(d+'T12:00:00Z');a.setUTCDate(a.getUTCDate()+n);return a.toISOString().slice(0,10);}
export function weekStart(d=today()){const a=new Date(d+'T12:00:00Z');return addDays(d,-((a.getUTCDay()+4)%7));}
export function newRound(flavors:Flavor[],start=weekStart(),previous?:Round,productionDay=start):Round{return {id:uid(),start,end:addDays(start,6),status:'aberta',productionDay,productionClosed:false,legacyProduction:false,production:flavors.filter(f=>f.active).map(f=>({flavorId:f.id,planned:previous?.production.find(p=>p.flavorId===f.id)?.planned||0,produced:0})),fairs:[]};}
export const flavorCatalog=[
 ['Frango com catupiry','base'],['Queijo','base'],['Pizza','base'],['Carne','base'],['Carne com queijo','base'],['Carne, queijo e ovo','base'],['Frango com queijo','base'],['Calabresa com queijo','base'],['Carne seca com queijo','base'],['Pernil com queijo','base'],['Palmito','base'],['Especial','base'],['Nutella','na_feira'],['Camarão com catupiry','na_feira'],['Brócolis com queijo','na_feira'],['Calabresa e bacon','na_feira'],['Berinjela com queijo','na_feira'],['Carne com jiló','na_feira'],['Escarola com queijo','na_feira']
] as const;
export function emptyState():State{return {records:[],settings:defaultSettings(),flavors:flavorCatalog.map(([name,prepKind],i)=>({id:'sabor-'+i,name,price:0,active:true,prepKind,prices:{}})),rounds:[],expenses:[]};}
export function newFair(r:Round,flavors:Flavor[],name:string,date:string,scheduleKey:Fair['scheduleKey']=null):Fair{return {id:uid(),scheduleKey,name,date,status:'planejada',team:'',transport:'',notes:'',startTime:null,closeTime:null,loadConfirmed:false,returnSealed:false,lines:flavors.filter(f=>f.active).map(f=>({flavorId:f.id,planned:0,taken:0,returned:0,reusable:0,loss:0,adjustment:0,soldOut:false,price:scheduleKey?f.prices?.[scheduleKey]??f.price:f.price})),cash:{closed:false,float:0,cash:0,pix:0,card:0,withdrawal:0}};}
export const estimated=(l:Line)=>l.taken-l.returned-l.loss+l.adjustment;
export const revenue=(f:Fair)=>f.cash.cash+f.cash.pix+f.cash.card+f.cash.withdrawal-f.cash.float;
export function available(r:Round,flavorId:string,excludeFair?:string){return (r.production.find(p=>p.flavorId===flavorId)?.produced||0)+r.fairs.filter(f=>f.id!==excludeFair&&f.status==='retorno').reduce((a,f)=>a+(f.lines.find(l=>l.flavorId===flavorId)?.reusable||0),0)-r.fairs.filter(f=>f.id!==excludeFair).reduce((a,f)=>a+(f.lines.find(l=>l.flavorId===flavorId)?.taken||0),0);}
export function stats(r:Round|undefined,s:State){const done=r?.fairs.filter(f=>f.status==='retorno')||[];const lines=done.flatMap(f=>f.lines);const taken=lines.reduce((a,l)=>a+l.taken,0),returned=lines.reduce((a,l)=>a+l.returned,0);const cash=r?.fairs.filter(f=>f.cash.closed)||[];const gross=cash.reduce((a,f)=>a+revenue(f),0),cost=s.expenses.filter(e=>e.roundId===r?.id).reduce((a,e)=>a+e.amount,0);return {produced:r?.production.reduce((a,p)=>a+p.produced,0)||0,taken,returned,output:lines.reduce((a,l)=>a+estimated(l),0),returnRate:taken?100*returned/taken:null,gross,cost,net:gross-cost,cashCount:cash.length};}
export function demoState():State{const s=emptyState();s.settings.schedules.forEach((f,i)=>{f.startTime='06:00';f.closeTime=i===0?'15:00':'14:00';});s.flavors.forEach((f,i)=>f.price=f.name==='Especial'?2500:1200+(i%4)*100);const r=newRound(s.flavors);r.production.forEach((p,i)=>{p.planned=i<12?[140,180,80,220,120,80,120,100,70,70,60,40][i]:0;p.produced=0;});s.settings.schedules.forEach(t=>{const f=newFair(r,s.flavors,t.name,addDays(r.start,t.offset),t.key);f.startTime=t.startTime;f.closeTime=t.closeTime;f.team='Robson e Erly';f.transport=t.region;r.fairs.push(f);});s.rounds=[r];return s;}
export const moneyText=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v/100);
export const dateText=(v:string)=>new Date(v+'T12:00:00Z').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
