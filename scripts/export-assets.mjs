// Technical exports only: slice the generated atlas and size it for the interface.
// Usage: node scripts/export-assets.mjs [path-to-sharp-package]
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const sharp = require(process.argv[2] || 'sharp');
const source = new URL('../assets/source/', import.meta.url);
const destination = new URL('../public/assets/', import.meta.url);
await mkdir(destination, { recursive: true });
const names = [
  'frog','fox','panda','octopus','chick','koala',
  'copper-cottage','blue-townhouse','lavender-bookshop','coral-bakery','ruby-theater','gold-apartments',
  'emerald-greenhouse','sapphire-tower','tram','power','water','rocket',
  'police','park','siren','tax','city-card','event-card',
  'coins','house','apartment','dice-1','dice-2','dice-3',
  'dice-4','dice-5','dice-6','handshake','trophy','mortgage'
];
// The generator left variable gutters. These boundaries preserve complete silhouettes.
const xs = [0, 212, 420, 632, 842, 1048, 1254];
const ys = [0, 225, 428, 639, 834, 1020, 1254];
const manifest = [];
for (const [index, name] of names.entries()) {
  const col = index % 6, row = Math.floor(index / 6);
  const size = index < 6 ? 80 : name.startsWith('dice-') ? 112 : name === 'trophy' ? 144 : 112;
  const crop = await sharp(fileURLToPath(new URL('game-atlas.png', source)))
    .extract({ left: xs[col], top: ys[row], width: xs[col+1] - xs[col], height: ys[row+1] - ys[row] })
    .toBuffer();
  await sharp(crop).trim({ threshold: 8 }).resize(size, size, { fit: 'contain', background: '#00000000' })
    .webp({ lossless: true }).toFile(fileURLToPath(new URL(`${name}.webp`, destination)));
  manifest.push({ name, width: size, height: size, file: `/assets/${name}.webp`, sourceCell: index });
}
for (const [name, width, quality] of [['cartoon-town', 1280, 82], ['confetti-paper', 512, 76]]) {
  await sharp(fileURLToPath(new URL(`${name}.png`, source))).resize({ width }).webp({ quality })
    .toFile(fileURLToPath(new URL(`${name}.webp`, destination)));
}
await writeFile(new URL('manifest.json', destination), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Exported ${names.length} icons and 2 backgrounds.`);
