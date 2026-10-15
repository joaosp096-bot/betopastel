import {createRequire} from 'node:module';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const dirs=await readdir('node_modules/.pnpm');
const esbuild=require(path.resolve('node_modules/.pnpm',dirs.find(n=>n.startsWith('esbuild@0.28.'))||dirs.find(n=>n.startsWith('esbuild@')),'node_modules/esbuild/lib/main.js'));
const result=await esbuild.build({entryPoints:['preview/entry.tsx'],bundle:true,write:false,minify:true,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},tsconfig:'tsconfig.json'});
const cssFiles=await readdir('dist/client/_next/static/css');
let css=await readFile(path.join('dist/client/_next/static/css',cssFiles.find(n=>n.endsWith('.css'))),'utf8');
for(const filename of await readdir('public/fonts')){if(filename.endsWith('.ttf')){const font=(await readFile('public/fonts/'+filename)).toString('base64');css=css.replaceAll('/fonts/'+filename,'data:font/ttf;base64,'+font);}}
const photo='data:image/png;base64,'+(await readFile('public/images/pastel.png')).toString('base64');
const script=result.outputFiles[0].text.replaceAll('/images/pastel.png',photo).replace(/<\/script/gi,'<\\/script');
const out=process.argv[2]||'work/Beto_Pastel_Previa.html';
await writeFile(out,`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Beto Pastel — prévia interativa</title><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%23e73429'/%3E%3Ctext x='16' y='24' text-anchor='middle' fill='white' font-family='sans-serif' font-size='22'%3EB%3C/text%3E%3C/svg%3E"><style>${css}</style></head><body><div id="root"></div><script>${script}</script></body></html>`);
console.log('Prévia criada: '+out);
