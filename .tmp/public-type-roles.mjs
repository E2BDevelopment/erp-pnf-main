import fs from 'node:fs';
import postcss from 'postcss';
import prettier from 'prettier';
const file='src/app/landing.css',root=postcss.parse(fs.readFileSync(file,'utf8'));
const page=root.nodes.find(n=>n.type==='rule'&&n.selector==='.landing-page');
page.prepend({prop:'--landing-body-size',value:'0.875rem'});
root.walkDecls('font-size',d=>{
 const match=d.value.match(/^([\d.]+)rem$/);if(!match)return;
 const size=Number(match[1]);
 if(size<=.8)d.value='var(--landing-label-size)';
 else if(size<1)d.value='var(--landing-body-size)';
 else if(size<1.1)d.value=d.parent.selector.includes('h3')?'1.125rem':'1rem';
 else if(size===1.1)d.value='1.125rem';
});
root.walkDecls('font-weight',d=>{const w=Number(d.value);if(w>400&&w<500)d.value='400';else if(w>500&&w<600)d.value='500';else if(w>600&&w<700)d.value='600';else if(w>700)d.value='700';});
fs.writeFileSync(file,await prettier.format(root.toString(),{parser:'css'}));
