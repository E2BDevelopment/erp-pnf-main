import fs from 'node:fs';
import postcss from 'postcss';
import prettier from 'prettier';
const file='src/app/landing.css',root=postcss.parse(fs.readFileSync(file,'utf8')),map=new Map();
function colors(values,token){for(const color of values.split(' '))map.set(color,`var(${token})`);}
colors('#f47721 #f36b21 #ff8a38','--primary');
colors('#c2410c #9a3f0a #b4470b #b64a0d #a8470d #a33c08','--primary-ink');
map.set('#de5915','color-mix(in srgb, var(--primary) 90%, var(--foreground))');
colors('#20252b #222326 #34383c #34353a #37383c #393e42 #424348 #474b4e','--foreground');
colors('#f6f5f1 #fbfaf6 #faf9f6 #f5f3ed #f9fafb','--background');
colors('#fff','--card');
colors('#f1efe8 #f0efeb #e7e4dc','--muted');
colors('#c9c6bd #d7d4cb #e6e2d9 #e1ded6 #d2cfc6 #d6d3cb #d1cec6 #dedbd3 #d5d2ca #cfccc3 #d9d6ce #e9e7e2 #bdbab1 #dfdcd4 #e1ded7 #b8c5b4','--border');
colors('#62666a #62666b #66676a #53585c #56575b #5f6773 #65666a #54585b','--muted-foreground');
colors('#d1d0ce #c2c8cf #bbb9b5 #c8c7c3 #cfcecb #d2d5d6','--landing-on-dark-muted');
colors('#f1f0ed #e4e2dc #e0dfdc','--sidebar-foreground');
colors('#303236','--sidebar-accent');
colors('#494a4d #393a3d #4a4b4e #595a5d','--sidebar-border');
colors('#fff1e6 #f5e3d4 #f2c8aa','--accent');
colors('#fef3c7','--color-amber-100');colors('#78350f','--color-amber-800');
colors('#d1fae5 #e5eee1','--color-emerald-100');colors('#065f46 #31563c','--color-emerald-800');
colors('#000','--foreground');
const missing=new Set();
root.walkDecls(d=>{
 if(['--landing-pencil','--landing-orange','--landing-paper','--landing-ink'].includes(d.prop)){d.remove();return;}
 d.value=d.value.replace(/#[0-9a-fA-F]{3,8}\b/g,color=>{const value=map.get(color.toLowerCase());if(!value)missing.add(color);return value??color;});
 d.value=d.value.replace(/rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)%\)/g,(all,r,g,b,alpha)=>{
  const source=+r===243?'var(--primary)':+r>200?'var(--sidebar-foreground)':'var(--foreground)';
  return `color-mix(in srgb, ${source} ${alpha}%, transparent)`;
 });
 for(const [old,name]of [['orange','primary'],['paper','background'],['ink','foreground'],['pencil','muted-foreground']])d.value=d.value.replaceAll(`var(--landing-${old})`,`var(--${name})`);
});
if(missing.size)throw new Error('Unmapped colors '+[...missing].join(' '));
const page=root.nodes.find(n=>n.type==='rule'&&n.selector==='.landing-page');
page.prepend({prop:'--landing-on-dark-muted',value:'color-mix(in srgb, var(--sidebar-foreground) 80%, var(--sidebar))'});
page.prepend({prop:'--landing-label-size',value:'0.75rem'});
// Un único tamaño de etiqueta para los metadatos y los seis nombres del diagrama.
root.walkDecls('font-size',d=>{if(d.value==='0.75rem')d.value='var(--landing-label-size)';});
root.prepend(postcss.comment({text:'Páginas públicas: roles derivados del tema de ERP PNF. Sin paleta paralela.'}));
fs.writeFileSync(file,await prettier.format(root.toString(),{parser:'css'}));console.log('mapped colors',map.size,'literal colors remaining',String(root).match(/#[0-9a-fA-F]{3,8}\b/g)?.length??0);
