import fs from 'node:fs';
for (const [file, resource] of [
 ['src/components/clientes/CatalogoClientesModule.tsx','clientes'],
 ['src/components/terceros/CatalogoTerceroModule.tsx','proveedores y contratistas'],
 ['src/components/trabajadores/CatalogoTrabajadoresModule.tsx','trabajadores'],
]) {
 let s=fs.readFileSync(file,'utf8');
 s=s.replace('import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";', 'import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";');
 s=s.replace('<Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>',`<ToggleGroup type="single" value={tab} aria-label="Filtrar ${resource} por autorización" className="inline-flex h-8 rounded-lg bg-muted p-1 text-muted-foreground" onValueChange={(v) => { if (v) setTab(v as typeof tab); }}>`);
 s=s.replace(/\s*<TabsList className="h-8">/,'');
 s=s.replace(/\s*<\/TabsList>/,'');
 s=s.replace('</Tabs>','</ToggleGroup>');
 s=s.replaceAll('TabsTrigger','ToggleGroupItem');
 s=s.replaceAll('className="text-xs h-6 px-2"','className="text-xs h-6 px-2 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow"');
 fs.writeFileSync(file,s);
}
