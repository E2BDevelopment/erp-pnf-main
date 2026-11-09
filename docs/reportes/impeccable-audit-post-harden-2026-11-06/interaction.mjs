import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const out=new URL('./',import.meta.url),b=await chromium.launch({channel:'msedge',headless:true}),c=await b.newContext({viewport:{width:360,height:900},reducedMotion:'reduce'}),p=await c.newPage();
try{
 await p.goto('http://127.0.0.1:3100/login');await p.getByLabel('Correo electrónico',{exact:true}).fill('director@demo.pnf');await p.getByLabel('Contraseña',{exact:true}).fill('Demo1234!');await p.getByRole('button',{name:'Ingresar',exact:true}).click();await p.waitForURL('**/app/dashboard');
 await p.goto('http://127.0.0.1:3100/app/catalogos/trabajadores');await p.waitForLoadState('networkidle');await p.getByRole('button',{name:'Más acciones del trabajador',exact:true}).first().focus();await p.keyboard.press('Space');await p.waitForTimeout(1000);const keyboard={menus:await p.getByRole('menu').count(),dialogs:await p.getByRole('dialog').count(),domDialogs:await p.locator('[role="dialog"]').evaluateAll(es=>es.map(e=>({hidden:e.getAttribute('aria-hidden'),text:e.textContent.slice(0,180)}))),titles:await p.getByRole('heading').allTextContents()};await p.screenshot({path:fileURLToPath(new URL('trabajadores-keyboard.png',out)),fullPage:false});
 await p.goto('http://127.0.0.1:3100/app/equipo');await p.getByRole('button',{name:/Quitar .* del equipo/}).first().click();await p.waitForTimeout(1000);const axe=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();const alert={violations:axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))})),motion:await p.getByRole('alertdialog').evaluate(e=>({name:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration,opacity:getComputedStyle(e).opacity}))};await p.screenshot({path:fileURLToPath(new URL('confirmar-baja-estable.png',out)),fullPage:true});
 await writeFile(new URL('interaction.json',out),JSON.stringify({keyboard,alert},null,2));console.log(JSON.stringify({keyboard,alert}));
}finally{await b.close();}
