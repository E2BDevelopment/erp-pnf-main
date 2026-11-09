import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();
try{
 await page.goto('http://localhost:3000/login');await page.getByLabel('Correo electrónico',{exact:true}).fill('director@demo.pnf');await page.getByLabel('Contraseña',{exact:true}).fill('Demo1234!');await page.getByRole('button',{name:'Ingresar',exact:true}).click();await page.waitForURL('**/app/dashboard');await page.locator('.recharts-bar-rectangle path').first().waitFor();await page.waitForTimeout(2500);
 const chart=await page.evaluate(()=>[...document.querySelectorAll('.recharts-bar-rectangle path')].slice(0,10).map(e=>({fill:getComputedStyle(e).fill,attribute:e.getAttribute('fill'),primary:getComputedStyle(e).getPropertyValue('--primary'),alias:getComputedStyle(e).getPropertyValue('--color-primary'),series:getComputedStyle(e).getPropertyValue('--color-produccion')})));
 await page.goto('http://localhost:3000/app/equipo');await page.getByRole('button',{name:'Crear usuario'}).click();
 const close=await page.getByRole('button',{name:'Close',exact:true}).evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));
 const reduced=await page.emulateMedia({reducedMotion:'reduce'});await page.keyboard.press('Escape');await page.getByRole('button',{name:'Crear usuario'}).click();
 const animation=await page.getByRole('dialog').evaluate(e=>({animation:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration}));
 console.log(JSON.stringify({chart,close,animation}));await writeFile(new URL('chart-and-controls.json',import.meta.url),JSON.stringify({chart,close,animation},null,2));
}finally{await browser.close();}
