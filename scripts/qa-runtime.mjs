import {createRequire} from 'node:module';
import {readdir,readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pbkdf2Sync} from 'node:crypto';
const require=createRequire(import.meta.url),dirs=await readdir('node_modules/.pnpm');
const {Miniflare}=require(path.resolve('node_modules/.pnpm',dirs.find(n=>n.startsWith('miniflare@')),'node_modules/miniflare'));
const config=JSON.parse(await readFile('dist/server/wrangler.json','utf8'));
const target=process.argv[2]||'integration',port=target==='browser'?8798:8789;
const persist=path.resolve(process.argv[3]||'work/qa-'+target+'-miniflare');await mkdir(persist,{recursive:true});
const salt='b7'.repeat(16),passwordHash='pbkdf2-sha256$100000$'+salt+'$'+pbkdf2Sync('qa-secret-2026',Buffer.from(salt,'hex'),100000,32,'sha256').toString('hex');
async function collect(dir){let files=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())files.push(...await collect(p));else if(p.endsWith('.js')||p.endsWith('.mjs'))files.push(p);}return files;}
const rootModules=path.resolve('dist/server'),paths=await collect(rootModules);const modules=[path.join(rootModules,'index.js'),...paths.filter(p=>p!==path.join(rootModules,'index.js'))].map(p=>({type:'ESModule',path:p}));
const mf=new Miniflare({name:'beto-qa-'+target,modules,modulesRoot:rootModules,compatibilityDate:config.compatibility_date,compatibilityFlags:config.compatibility_flags,bindings:{BETO_BOOTSTRAP_EMAIL:'admin@example.test',BETO_BOOTSTRAP_PASSWORD_HASH:passwordHash,BETO_WORKSPACE_ID:'beto-qa'},d1Databases:{DB:config.d1_databases[0].database_id},d1Persist:persist,host:'127.0.0.1',port,assets:{directory:path.resolve('dist/client'),routerConfig:{has_user_worker:true}}});
await mf.ready;const db=await mf.getD1Database('DB');
if(!await db.prepare("SELECT name FROM sqlite_master WHERE name='beto_users'").first()){
 for(const file of (await readdir('drizzle')).filter(n=>n.endsWith('.sql')).sort()){
  const sql=(await readFile('drizzle/'+file,'utf8')).replace(/-->[^\n]*/g,'');
  const statements=sql.split(';').map(s=>s.trim()).filter(Boolean);await db.batch(statements.map(s=>db.prepare(s)));
 }
}
console.log('QA_READY http://127.0.0.1:'+port);
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,async()=>{await mf.dispose();process.exit(0)});
await new Promise(()=>{});
