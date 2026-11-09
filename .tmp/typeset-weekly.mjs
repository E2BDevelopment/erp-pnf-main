import fs from 'node:fs';
import postcss from 'postcss';
import prettier from 'prettier';
const file='src/app/landing.css',root=postcss.parse(fs.readFileSync(file,'utf8'));
const labels=new Set(['.landing-drawing-top','.landing-drawing-bottom','.landing-structure-node']);
root.walkRules(rule=>{
 if(!labels.has(rule.selector))return;
 rule.walkDecls('font-size',d=>d.remove());
 if(rule.parent.type==='root'){
  rule.append({prop:'font-size',value:'var(--landing-label-size)'});
  rule.append({prop:'line-height',value:'1.33'});
  rule.append({prop:'overflow-wrap',value:'anywhere'});
  rule.walkDecls('font-weight',d=>d.remove());
  rule.append({prop:'font-weight',value:rule.selector==='.landing-structure-node'?'600':'500'});
  if(rule.selector!=='.landing-structure-node')rule.append({prop:'flex-wrap',value:'wrap'});
 }
 if(!rule.nodes.length)rule.remove();
});
root.append(postcss.parse(`
@media (max-width: 980px) {
  .landing-drawing-structure { flex-direction: column; min-height: 0; padding-block: 24px; }
  .landing-structure-node { width: min(100%, 14rem); padding: 10px 12px; }
  .landing-structure-node + i { position: relative; width: 1px; height: 20px; flex: 0 0 20px; }
  .landing-structure-node + i::after { position: absolute; bottom: 0; left: 50%; margin: 0; transform: translateX(-50%) rotate(135deg); }
}
`).nodes);
fs.writeFileSync(file,await prettier.format(root.toString(),{parser:'css'}));
