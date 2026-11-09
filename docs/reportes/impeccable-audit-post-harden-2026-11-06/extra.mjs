import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const out=new URL('./',import.meta.url),base='http://127.0.0.1:3100';
const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({viewport:{width:360,height:900},reducedMotion:'reduce',locale:'es-MX'});const page=await context.newPage(),results=[];
async function scan(name){await page.waitForLoadState('networkidle');const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();const data={name,url:page.url(),layout:await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth})),violations:axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({html:n.html,target:n.target,summary:n.failureSummary}))}))};results.push(data);await page.screenshot({path:fileURLToPath(new URL(`${name}-360.png`,out)),fullPage:true});await writeFile(new URL('extra.json',out),JSON.stringify(results,null,2));console.log(name,JSON.stringify(data));}
try{
 await page.goto(base+'/login');await page.getByLabel('Correo electrónico',{exact:true}).fill('director@demo.pnf');await page.getByLabel('Contraseña',{exact:true}).fill('Demo1234!');await page.getByRole('button',{name:'Ingresar',exact:true}).click();await page.waitForURL('**/app/dashboard');
 for(const tab of ['identidad','cuentas','permisos','documentacion','notificaciones']){await page.goto(base+'/app/configuracion?tab='+tab);await scan('config-'+tab);}
 await page.goto(base+'/app/configuracion?tab=configuracion');await page.waitForLoadState('networkidle');const edit=page.getByRole('button',{name:/Editar/}).first();if(await edit.count()){await edit.click();await scan('editar-unidad-negocio');}
 await page.goto(base+'/app/equipo');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:/Quitar .* del equipo/}).first().click();await scan('confirmar-baja');console.log('alert-motion',await page.getByRole('alertdialog').evaluate(e=>({name:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration})));await page.keyboard.press('Escape');
}finally{await browser.close();}
