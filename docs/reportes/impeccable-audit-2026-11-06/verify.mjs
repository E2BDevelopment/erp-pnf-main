import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';
const dir=new URL('./',import.meta.url), results=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},locale:'es-MX'});
const page=await context.newPage();
async function scan(name,width){
 await page.setViewportSize({width,height:900});await page.waitForTimeout(2500);
 const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
 results.push({name,width,url:page.url(),violations:a.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({html:n.html,target:n.target,summary:n.failureSummary}))}))});
 await page.screenshot({path:decodeURIComponent(new URL(`${name}-${width}.png`,dir).pathname).replace(/^\/(\w:)/,'$1'),fullPage:true});
 await writeFile(new URL('verification.json',dir),JSON.stringify(results,null,2));
 console.log(name,width,results.at(-1).violations.map(v=>`${v.id}:${v.nodes.length}`));
}
try{
 await page.goto('http://localhost:3000/login');
 await page.getByLabel('Correo electrónico',{exact:true}).fill('director@demo.pnf');await page.getByLabel('Contraseña',{exact:true}).fill('Demo1234!');await page.getByRole('button',{name:'Ingresar',exact:true}).click();await page.waitForURL('**/app/dashboard');await page.waitForLoadState('networkidle');await page.getByText('Espera visto bueno',{exact:true}).waitFor();
 await scan('stable-dashboard',1440);await scan('stable-dashboard',360);
 await page.goto('http://localhost:3000/app/configuracion');await page.waitForLoadState('networkidle');await page.locator('input[required]').first().waitFor();await scan('stable-configuracion',1440);await scan('stable-configuracion',360);
 await page.goto('http://localhost:3000/app/equipo');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Crear usuario'}).click();await scan('crear-usuario',360);
 await page.keyboard.press('Escape');await page.goto('http://localhost:3000/app/catalogos');await page.waitForLoadState('networkidle');await scan('stable-catalogos',1440);await scan('stable-catalogos',360);
}finally{await browser.close();}
