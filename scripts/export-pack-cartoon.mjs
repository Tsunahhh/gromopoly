// Technical image export only. Usage: node scripts/export-pack-cartoon.mjs [sharp-package-path]
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const sharp = createRequire(import.meta.url)(process.argv[2] || 'sharp');
const root = new URL('../', import.meta.url);
const config = JSON.parse(await readFile(new URL('assets/pack-cartoon.json', root), 'utf8'));
const target = new URL('public/assets/pack-cartoon/', root);
await mkdir(target, { recursive: true });
const manifest = [];
for (const item of config) {
  const source = fileURLToPath(new URL(item.source || `assets/source/pack-cartoon/${item.id}.png`, root));
  const meta = await sharp(source).metadata();
  if (!item.opaque && !meta.hasAlpha) throw new Error(`Missing alpha: ${item.id}`);
  const files = {};
  if (item.icon || item.landscape) {
    const sizes = item.icon ? [512,192,180,32] : [1200];
    for (const size of sizes) {
      for (const format of ['png','webp']) {
        const name = `${item.id}${item.icon ? '-'+size : ''}.${format}`;
        const path = fileURLToPath(new URL(name, target));
        const height = item.landscape ? 630 : size;
        await sharp(source).resize(size,height).flatten({background:'#aa83cf'}).toFormat(format).toFile(path);
        files[`${size}-${format}`] = {url:`/assets/pack-cartoon/${name}`,width:size,height,bytes:(await stat(path)).size};
      }
    }
    manifest.push({...item,files});
    continue;
  }
  for (const [variant, size] of [['jeu', item.size], ['detail', 256]]) {
    const name = `${item.id}${variant === 'detail' ? '-256' : ''}.webp`;
    const path = fileURLToPath(new URL(name, target));
    await sharp(source).resize(size, size, { fit: 'contain', background: '#00000000' }).webp({ quality: 88, alphaQuality: 100 }).toFile(path);
    const decoded = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparent = 0;
    for (let i = 3; i < decoded.data.length; i += 4) if (decoded.data[i] === 0) transparent++;
    if (!transparent) throw new Error(`No transparent pixels: ${name}`);
    files[variant] = { url: `/assets/pack-cartoon/${name}`, width: size, height: size, bytes: (await stat(path)).size };
  }
  manifest.push({ ...item, files });
}
await writeFile(new URL('manifest.json', target), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ illustrations: manifest.length, exports: manifest.reduce((n,item)=>n+Object.keys(item.files).length,0), bytes: manifest.reduce((sum, item) => sum + Object.values(item.files).reduce((n,f)=>n+f.bytes,0), 0) }));
