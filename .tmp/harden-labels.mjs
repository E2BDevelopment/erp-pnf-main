import ts from 'typescript';
import fs from 'node:fs';
const files = [
 'src/components/configuracion/FacturacionTab.tsx',
 'src/components/configuracion/ConfiguracionTab.tsx',
 'src/components/equipo/EquipoModule.tsx',
 'src/components/insumos/CatalogoInsumosModule.tsx',
 'src/components/insumos/SolicitarInsumoRapidoDialog.tsx',
 'src/app/(authenticated)/app/obras/[obraId]/configuracion/page.tsx',
];
const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/([a-z])([A-Z])/g,'$1-$2').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();
for(const file of files){
 let text=fs.readFileSync(file,'utf8');
 const source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const edits=[],ids=new Set();
 const tag=n=>ts.isJsxElement(n)?n.openingElement:ts.isJsxSelfClosingElement(n)?n:null;
 const has=(n,name)=>n.attributes.properties.some(a=>a.name?.text===name);
 const add=(n,name,value)=>edits.push({at:n.tagName.end,text:` ${name}="${value}"`});
 function visit(n){
  if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(source)==='Label'&&!has(n.openingElement,'htmlFor')){
   const siblings=n.parent.children;
   const index=siblings?.indexOf(n);
   const next=siblings?.slice(index+1).find(x=>!(ts.isJsxText(x)&&!x.text.trim())&&!ts.isJsxExpression(x));
   let control=next&&tag(next);
   if(control?.tagName.getText(source)==='Select'){
    control=next.children.map(tag).find(x=>x?.tagName.getText(source)==='SelectTrigger');
   }
   if(control&&['Input','Textarea','SelectTrigger'].includes(control.tagName.getText(source))&&!has(control,'id')){
    let owner=n;
    while(owner&&!ts.isFunctionDeclaration(owner))owner=owner.parent;
    const prefix=owner?.name?.text??file.split('/').at(-1).replace('.tsx','');
    const value=control.attributes.properties.find(a=>a.name?.text==='value')?.initializer?.getText(source);
    const label=n.children.map(x=>ts.isJsxText(x)?x.text:'').join('').trim();
    const base=slug(prefix+'-'+(label||value||'campo'));
    let id=base,i=2;while(ids.has(id))id=base+'-'+i++;
    ids.add(id);add(n.openingElement,'htmlFor',id);add(control,'id',id);
    console.log(file,id);
   }
  }
  ts.forEachChild(n,visit);
 }
 visit(source);
 for(const e of edits.sort((a,b)=>b.at-a.at))text=text.slice(0,e.at)+e.text+text.slice(e.at);
 fs.writeFileSync(file,text);
}
