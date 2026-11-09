import fs from 'node:fs';
const file='src/app/globals.css';let css=fs.readFileSync(file,'utf8');
// Conserva las reglas existentes; sube solo la información del ejemplo y del flujo.
css=css.replace(/(\.landing-(?:preview[^{}]*|brand (?:strong|small)|flow-step small|principle|problem-list p span)\s*\{)([^{}]*)(\})/g,(all,start,body,end)=>start+body.replace(/font-size:\s*(0?\.\d+)rem/g,(value,size)=>Number(size)<.75?'font-size: .75rem':value)+end);
fs.writeFileSync(file,css);
