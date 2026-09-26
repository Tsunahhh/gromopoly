// Exporte les illustrations du pack 2 (assets/source/pack-2/*.png) pour le jeu.
// Les originaux ne sont jamais modifiés. Relancer le script après avoir ajouté de nouvelles images.
// Usage : node scripts/export-pack-2.mjs   (nécessite sharp : npm install --no-save sharp)
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const sharp = createRequire(import.meta.url)(process.argv[2] || 'sharp');
const root = new URL('../', import.meta.url);
const path = relative => fileURLToPath(new URL(relative, root));
const brief = await readFile(path('assets/ILLUSTRATIONS_A_GENERER.md'), 'utf8');
const specs = JSON.parse(brief.match(/```json\s*([\s\S]*?)```/)[1]);
const sourceDir = 'assets/source/pack-2/', targetDir = 'public/assets/pack-2/';
await mkdir(path(targetDir), { recursive: true });
const present = new Set((await readdir(path(sourceDir))).filter(f => f.endsWith('.png')).map(f => f.slice(0, -4)));

// Fond magenta (ou vert) → transparence, avec bords adoucis et sans reflet coloré.
async function keyed(file, background) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const green = background === '#00FF00';
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const excess = green ? g - Math.max(r, b) : Math.min(r, b) - g;
    if (excess >= 150) data[i + 3] = 0;
    else if (excess > 60) {
      data[i + 3] = Math.round(255 * (150 - excess) / 90);
      if (green) data[i + 1] = Math.min(g, Math.max(r, b) + 60);
      else { data[i] = Math.min(r, g + 60); data[i + 2] = Math.min(b, g + 60); }
    }
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function transparentSource(file, background) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let clear = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 10) clear++;
  // Déjà détourée par le générateur : on la garde telle quelle.
  if (clear / (info.width * info.height) > .05) return sharp(file).png().toBuffer();
  return keyed(file, background || '#FF00FF');
}

// Sujet recadré au plus près puis centré avec une marge régulière (8 %).
async function square(buffer, size) {
  const trimmed = await sharp(buffer).trim({ threshold: 1 }).png().toBuffer();
  const inner = Math.round(size * .84), pad = Math.round((size - inner) / 2);
  return sharp(trimmed).resize(inner, inner, { fit: 'contain', background: '#00000000' })
    .extend({ top: pad, bottom: size - inner - pad, left: pad, right: size - inner - pad, background: '#00000000' });
}

const manifest = [], pending = [];
for (const item of specs) {
  if (!present.has(item.id)) { pending.push(item.id); continue; }
  const file = path(`${sourceDir}${item.id}.png`), files = {};
  const save = async (name, pipeline, format = 'webp') => {
    const out = path(targetDir + name);
    await pipeline.toFormat(format, format === 'webp' ? { quality: 88, alphaQuality: 100 } : { quality: 86 }).toFile(out);
    const meta = await sharp(out).metadata();
    files[name] = { url: `/assets/pack-2/${name}`, width: meta.width, height: meta.height, bytes: (await stat(out)).size };
  };
  if (item.id === 'app-icone') {
    for (const size of [512, 192, 180]) await save(`app-icone-${size}.png`, sharp(file).resize(size, size).flatten({ background: '#aa83cf' }), 'png');
    await save('favicon-32.png', sharp(file).resize(32, 32).flatten({ background: '#aa83cf' }), 'png');
  } else if (item.id === 'og-partage') {
    await save('og-partage.jpg', sharp(file).resize(1200, 630, { fit: 'cover' }).flatten({ background: '#ffd9c2' }), 'jpeg');
  } else {
    const cutout = await transparentSource(file, item.background);
    await save(`${item.id}.webp`, await square(cutout, item.export));
    await save(`${item.id}-256.webp`, await square(cutout, 256));
  }
  manifest.push({ id: item.id, priority: item.priority, files });
}

await writeFile(path(`${targetDir}manifest.json`), JSON.stringify(manifest, null, 2) + '\n');
// Liste lue par le jeu : une illustration n'est utilisée que si elle a été exportée.
await writeFile(path('src/pack-2.js'), `// Généré par scripts/export-pack-2.mjs : illustrations du pack 2 déjà exportées.\nexport default ${JSON.stringify(manifest.map(item => item.id))};\n`);
const bytes = manifest.reduce((n, item) => n + Object.values(item.files).reduce((m, f) => m + f.bytes, 0), 0);
console.log(JSON.stringify({ exportees: manifest.length, fichiers: manifest.reduce((n, i) => n + Object.keys(i.files).length, 0), ko: Math.round(bytes / 1024), manquantes: pending }));
