// Technical preparation of imagegen originals: chroma key, margins and export metadata.
// Usage: node scripts/prepare-pack-2.mjs [sharp-package-path]
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const sharp = createRequire(import.meta.url)(process.argv[2] || 'sharp');
const root = new URL('../', import.meta.url);
const brief = await readFile(new URL('assets/ILLUSTRATIONS_A_GENERER.md', root), 'utf8');
const specs = JSON.parse(brief.match(/```json\s*([\s\S]*?)```/)[1]);
const configPath = new URL('assets/pack-cartoon.json', root);
const config = JSON.parse(await readFile(configPath, 'utf8'));
await mkdir(new URL('assets/source/pack-2/transparent/', root), { recursive: true });
const pending=[];
for (const item of specs) {
  const source = new URL(`assets/source/pack-2/${item.id}.png`, root);
  let original;
  try { original = await readFile(source); } catch(error) {
    if(error.code!=='ENOENT') throw error;
    pending.push(item); continue;
  }
  let output;
  if (item.background) {
    const { data, info } = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    // Saturated chroma colors are absent from the illustrated palette.
    const green = item.background === '#00FF00';
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const excess = green ? g - Math.max(r,b) : Math.min(r,b) - g;
      if (excess > 110) data[i+3] = 0;
      else if (excess > 75) {
        // Remove chroma spill from antialiased edge pixels.
        if (green) data[i+1] = Math.max(r,b);
        else { data[i] = Math.min(r,g+30); data[i+2] = Math.min(b,g+30); }
      }
    }
    const cutout = await sharp(data, { raw: info }).trim({ threshold: 5 }).png().toBuffer();
    output = await sharp(cutout).resize(716,716,{fit:'contain',background:'#00000000'})
      .extend({top:154,bottom:154,left:154,right:154,background:'#00000000'}).png().toBuffer();
    await writeFile(new URL(`assets/source/pack-2/transparent/${item.id}.png`, root), output);
    // The brief asks for a chroma-key source as well as a transparent derivative.
    // Unmodified imagegen originals remain in Codex's generated_images directory.
    await writeFile(source, await sharp(output).flatten({background:item.background}).png().toBuffer());
  } else {
    output = await sharp(original).resize(...item.size,{fit:'cover'}).flatten({background:'#aa83cf'}).png().toBuffer();
    await writeFile(source, output);
  }
  const entry = { id:item.id, title:item.id, category:item.id.split('-')[0], subject:item.subject,
    size:item.export, source:`assets/source/pack-2/${item.background ? 'transparent/' : ''}${item.id}.png`,
    opaque:!item.background, ...(item.id==='app-icone'?{icon:true}:{}), ...(item.id==='og-partage'?{landscape:true}:{}) };
  const index=config.findIndex(x=>x.id===item.id);
  if(index<0) config.push(entry); else config[index]=entry;
}
await writeFile(configPath, JSON.stringify(config,null,2)+'\n');
await writeFile(new URL('assets/pack-2-pending.json',root),JSON.stringify(pending,null,2)+'\n');
console.log(`Prepared ${specs.length-pending.length} illustrations; ${pending.length} pending.`);
