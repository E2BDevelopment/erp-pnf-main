import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';
const out = new URL('./', import.meta.url);
const browser = await chromium.launch({channel:'msedge', headless:true});
const context = await browser.newContext({viewport:{width:1440,height:900},locale:'es-MX'});
const page = await context.newPage();
const results=[];
async function scan(name,width=1440) {
  await page.setViewportSize({width,height:900});
  await page.waitForTimeout(1200);
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
  const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+2||r.left < -2)&&getComputedStyle(e).position!=='fixed';}).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent?.slice(0,70)})),
    unlabeled:[...document.querySelectorAll('input,textarea,select,[role="combobox"]')].filter(e=>!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&!e.labels?.length).map(e=>({tag:e.tagName,placeholder:e.getAttribute('placeholder'),html:e.outerHTML.slice(0,450)}))}));
  await page.screenshot({path:new URL(`${name}-${width}.png`,out).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});
  const data={name,url:page.url(),width,layout,violations:axe.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({html:n.html,target:n.target,summary:n.failureSummary}))}))};
  results.push(data);
  await writeFile(new URL('runtime.json',out),JSON.stringify(results,null,2));
  console.log(name,width,'overflow',layout.scrollWidth, 'axe',data.violations.map(v=>`${v.id}:${v.nodes.length}`).join(','));
}
try {
 for(const [name,path] of [['landing','/'],['recorrido','/recorrido'],['login','/login']]){
  await page.goto('http://localhost:3000'+path); await scan(name); await scan(name,360);
 }
 await page.goto('http://localhost:3000/login');
 await page.getByLabel('Correo electrónico',{exact:true}).fill('director@demo.pnf');
 await page.getByLabel('Contraseña',{exact:true}).fill('Demo1234!');
 await page.getByRole('button',{name:'Ingresar',exact:true}).click();
 await page.waitForURL('**/app/dashboard',{timeout:45000});
 for(const [name,path] of [['dashboard','/app/dashboard'],['configuracion','/app/configuracion'],['equipo','/app/equipo'],['catalogos','/app/catalogos'],['obras','/app/obras']]){
   await page.goto('http://localhost:3000'+path); await scan(name); await scan(name,360);
   console.log('buttons',name,await page.getByRole('button').allTextContents());
   if(name==='equipo'){
     const add=page.getByRole('button',{name:/agregar|invitar|nuevo/i}).first();
     if(await add.count()){await add.click();await scan('equipo-dialog',360);await page.keyboard.press('Escape');}
   }
   if(name==='obras'){
     const links=await page.locator('a[href^="/app/obras/"]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
     const obra=links.find(l=>/^\/app\/obras\/[^/]+$/.test(l)&&!l.endsWith('/nueva'));
     if(obra){for(const mod of ['','/requisiciones','/nomina','/configuracion']){await page.goto('http://localhost:3000'+obra+mod);await scan('obra'+(mod.replace('/','-')||'-inicio'));await scan('obra'+(mod.replace('/','-')||'-inicio'),360);}}
   }
 }
}catch(e){console.error(e);await writeFile(new URL('error.txt',out),String(e));process.exitCode=1;}
finally{await browser.close();}
