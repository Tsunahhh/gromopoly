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
  const source = fileURLToPath(new URL(`assets/source/pack-cartoon/${item.id}.png`, root));
  const meta = await sharp(source).metadata();
  if (!meta.hasAlpha) throw new Error(`Missing alpha: ${item.id}`);
  const files = {};
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
console.log(JSON.stringify({ illustrations: manifest.length, exports: manifest.length * 2, bytes: manifest.reduce((sum, item) => sum + item.files.jeu.bytes + item.files.detail.bytes, 0) }));
