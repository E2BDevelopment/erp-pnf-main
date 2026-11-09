import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const out=path.resolve('docs/reportes/impeccable-harden-2026-11-06');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:360,height:900},locale:'es-MX',reducedMotion:'reduce'});
const page=await context.newPage(),results=[];
async function capture(name){
 await page.waitForLoadState('networkidle');
 const axe=await new AxeBuilder({page}).withRules(['label','button-name','aria-valid-attr-value','label-content-name-mismatch']).analyze();
 const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
 const item={name,url:page.url(),layout,violations:axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({html:n.html,target:n.target}))}))};
 results.push(item);await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
 console.log(name,JSON.stringify(item));await writeFile(path.join(out,'verification.json'),JSON.stringify(results,null,2));
}
try{
 await page.goto('http://localhost:3000/login');await page.getByLabel('Correo electrónico',{exact:true}).fill('director@demo.pnf');await page.getByLabel('Contraseña',{exact:true}).fill('Demo1234!');await page.getByRole('button',{name:'Ingresar',exact:true}).click();await page.waitForURL('**/app/dashboard');await page.locator('.recharts-bar-rectangle path').first().waitFor();await capture('dashboard-mobile');
 await page.setViewportSize({width:1440,height:900});await capture('dashboard-desktop');await page.setViewportSize({width:360,height:900});
 await page.goto('http://localhost:3000/app/configuracion');await page.getByLabel('RFC *',{exact:true}).waitFor();await page.getByLabel('Razón social *',{exact:true}).fill('Constructora de Infraestructura, Vivienda y Urbanización del Bajío — 工事 🏗️ '.repeat(3));await capture('facturacion-long-text');
 await page.goto('http://localhost:3000/app/equipo');await page.getByRole('button',{name:'Crear usuario',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByLabel('Nombre completo',{exact:true}).fill('María José de la Construcción — 工事 🏗️ '.repeat(3));await capture('crear-usuario');
 console.log('dialog',await dialog.evaluate(e=>({animation:getComputedStyle(e).animationName})),await dialog.getByRole('button',{name:'Cerrar',exact:true}).evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));
 await page.keyboard.press('Escape');
 for(const section of ['clientes','insumos','proveedores','trabajadores']){await page.goto('http://localhost:3000/app/catalogos/'+section);await capture('catalogo-'+section);if(section==='insumos'){console.log('insumo buttons',await page.getByRole('button').allTextContents());const add=page.getByRole('button',{name:/Nuevo insumo|Solicitar insumo/}).first();if(await add.count()){await add.click();await capture('nuevo-insumo');await page.keyboard.press('Escape');}}}
 await page.goto('http://localhost:3000/app/obras');await page.waitForLoadState('networkidle');const links=await page.locator('a[href^="/app/obras/"]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));const obra=links.find(l=>/^\/app\/obras\/[^/]+$/.test(l)&&!l.endsWith('/nueva'));if(obra){await page.goto('http://localhost:3000'+obra+'/configuracion');await capture('obra-configuracion');}
}finally{await browser.close();}
