import fs from 'node:fs';
import postcss from 'postcss';
import prettier from 'prettier';
const file='src/app/globals.css',original=fs.readFileSync('.tmp/pre-distill-globals.css','utf8'),start=original.indexOf('/* Landing pública:');
const root=postcss.parse(original.slice(start));
const normalize=s=>s.trim().replace(/\s*([>+~])\s*/g,' $1 ').replace(/\s+/g,' ');
const active=new Set(JSON.parse(fs.readFileSync('docs/reportes/impeccable-distill-2026-11-06/active-selectors.json','utf8')).map(normalize));
const before={bytes:Buffer.byteLength(original.slice(start)),rules:0,declarations:0};root.walkRules(()=>before.rules++);root.walkDecls(()=>before.declarations++);
// Descarta selectores ausentes de ambas páginas y conserva pseudoestados consultados en la referencia.
root.walkRules(rule=>{const selectors=rule.selector.split(',').map(normalize).filter(x=>active.has(x));if(!selectors.length){rule.remove();return;}if(selectors.length>1){for(const selector of selectors)rule.cloneBefore({selector});rule.remove();}else rule.selector=selectors[0];});
function merge(container){
 const seen=new Map();for(const rule of [...container.nodes??[]]){
  if(rule.type==='atrule'){merge(rule);if(!rule.nodes?.length)rule.remove();continue;}
  if(rule.type!=='rule')continue;
  const previous=seen.get(rule.selector);if(previous){const older=previous.nodes.map(n=>n.clone());rule.prepend(older);previous.remove();}
  // Una propiedad repetida queda decidida por su última declaración; se preserva el orden con shorthands.
  const properties=new Set();for(const declaration of [...rule.nodes].reverse())if(declaration.type==='decl'){if(properties.has(declaration.prop))declaration.remove();else properties.add(declaration.prop);}
  seen.set(rule.selector,rule);
 }
}
merge(root);
// Las reglas base posteriores sustituyen estas propiedades incluso cuando se cumple el media query.
const future=new Map();
for(const node of [...root.nodes].reverse()){
 if(node.type==='rule'){
  const properties=future.get(node.selector)??new Set();node.walkDecls(d=>properties.add(d.prop));future.set(node.selector,properties);
 }else if(node.type==='atrule')node.walkRules(rule=>{const properties=future.get(rule.selector);rule.walkDecls(d=>{if(properties?.has(d.prop))d.remove();});if(!rule.nodes.length)rule.remove();});
}
root.walkAtRules(a=>{if(!a.nodes?.length)a.remove();});
root.walkComments(c=>c.remove());
const candidate=await prettier.format(root.toString(),{parser:'css'});
const after={bytes:Buffer.byteLength(candidate),rules:0,declarations:0};root.walkRules(()=>after.rules++);root.walkDecls(()=>after.declarations++);
fs.writeFileSync('.tmp/landing-consolidated.css',candidate);
fs.writeFileSync('docs/reportes/impeccable-distill-2026-11-06/consolidation.json',JSON.stringify({before,after},null,2));
const colors=new Set();root.walkDecls(d=>{for(const m of d.value.matchAll(/#[0-9a-fA-F]{3,8}\b/g))colors.add(m[0].toLowerCase());});console.log(JSON.stringify({before,after,colors:[...colors]},null,2));
if(process.argv.includes('--apply')){
 let globals=original.slice(0,start);globals=globals.replace('@import "tw-animate-css";','@import "tw-animate-css";\n@import "./landing.css";');
 fs.writeFileSync(file,globals.trimEnd()+'\n');fs.writeFileSync('src/app/landing.css',candidate);
}
