import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const out=new URL('./',import.meta.url), base='http://127.0.0.1:3100';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},locale:'es-MX',reducedMotion:'reduce'});
const page=await context.newPage(),results=[];
async function scan(name,width){
 await page.setViewportSize({width,height:900});await page.waitForLoadState('networkidle');
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
 const data=await page.evaluate(()=>({title:document.title,h1:[...document.querySelectorAll('h1')].map(e=>e.textContent),width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
  smallText:[...document.querySelectorAll('a,button,label,p,small,td,span')].filter(e=>{const r=e.getBoundingClientRect();return r.width>1&&r.height>1&&parseFloat(getComputedStyle(e).fontSize)<11&&e.textContent?.trim()&&getComputedStyle(e).visibility!=='hidden';}).slice(0,20).map(e=>({text:e.textContent.slice(0,65),px:getComputedStyle(e).fontSize})),
  controls:[...document.querySelectorAll('button,a,input,[role="combobox"]')].map(e=>({text:e.textContent?.slice(0,40),aria:e.getAttribute('aria-label'),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})).filter(e=>e.width>0&&e.height>0&&e.width<24&&e.height<24),
  chart:[...document.querySelectorAll('.recharts-bar-rectangle path')].slice(0,12).map(e=>({series:e.getAttribute('fill'),color:getComputedStyle(e).fill})),
  resources:performance.getEntriesByType('resource').map(e=>({name:e.name,transfer:e.transferSize,decoded:e.decodedBodySize})),
  navigation:performance.getEntriesByType('navigation').map(e=>({ttfb:e.responseStart-e.requestStart,dom:e.domContentLoadedEventEnd,load:e.loadEventEnd}))}));
 const result={name,url:page.url(),...data,violations:axe.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))}))};results.push(result);
 await page.screenshot({path:fileURLToPath(new URL(`${name}-${width}.png`,out)),fullPage:true});
 await writeFile(new URL('runtime.json',out),JSON.stringify(results,null,2));console.log(name,width,'overflow',data.scrollWidth,'violations',result.violations.map(v=>v.id+':'+v.nodes.length).join(','));
}
try{
 for(const [name,path] of [['landing','/'],['recorrido','/recorrido'],['login','/login']]){await page.goto(base+path);await scan(name,1440);await scan(name,360);}
 await page.goto(base+'/login');await page.getByLabel('Correo electrónico',{exact:true}).fill('director@demo.pnf');await page.getByLabel('Contraseña',{exact:true}).fill('Demo1234!');await page.getByRole('button',{name:'Ingresar',exact:true}).click();await page.waitForURL('**/app/dashboard');
 for(const [name,path] of [['dashboard','/app/dashboard'],['facturacion','/app/configuracion'],['general','/app/configuracion?tab=configuracion'],['equipo','/app/equipo'],['clientes','/app/catalogos/clientes'],['insumos','/app/catalogos/insumos'],['proveedores','/app/catalogos/proveedores'],['trabajadores','/app/catalogos/trabajadores'],['obras','/app/obras']]){
  await page.goto(base+path);await scan(name,1440);await scan(name,360);
  if(name==='equipo'){await page.getByRole('button',{name:'Crear usuario',exact:true}).click();await scan('crear-usuario',360);await page.keyboard.press('Escape');}
  if(name==='insumos'){for(const [name,label] of [['nuevo-insumo','Solicitar insumo'],['categorias','Categorías'],['unidades','Unidades']]){await page.getByRole('button',{name:label,exact:true}).click();await scan(name,360);await page.keyboard.press('Escape');}}
  if(name==='obras'){const links=await page.locator('a[href^="/app/obras/"]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));const obra=links.find(l=>/^\/app\/obras\/[^/]+$/.test(l)&&!l.endsWith('/nueva'));if(obra){for(const [name,suffix] of [['obra-configuracion','/configuracion'],['requisiciones','/requisiciones'],['nomina','/nomina']]){await page.goto(base+obra+suffix);await scan(name,1440);await scan(name,360);}}}
 }
}catch(e){console.error(e);await writeFile(new URL('error.txt',out),String(e));process.exitCode=1;}finally{await browser.close();}
