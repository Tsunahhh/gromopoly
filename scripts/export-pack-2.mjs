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

// Fond uni (couleur des coins) retiré par remplissage depuis les bords : les couleurs identiques à l'intérieur du sujet sont conservées.
async function removeFlatBackground(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info, at = (x, y) => (y * w + x) * 4;
  const bg = [0, 1, 2].map(c => Math.round([at(2, 2), at(w - 3, 2), at(2, h - 3), at(w - 3, h - 3)].reduce((n, i) => n + data[i + c], 0) / 4));
  const distance = i => Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
  const seen = new Uint8Array(w * h), stack = [];
  for (let x = 0; x < w; x++) stack.push([x, 0], [x, h - 1]);
  for (let y = 0; y < h; y++) stack.push([0, y], [w - 1, y]);
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h || seen[y * w + x]) continue;
    const i = at(x, y), d = distance(i);
    if (d > 95) continue;
    seen[y * w + x] = 1;
    // Cœur du fond : transparent. Bord anti-crénelé : transparence partielle, sans reflet violet.
    data[i + 3] = d < 45 ? 0 : Math.round(255 * (d - 45) / 50);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

// Sujet recadré au plus près puis centré avec une marge régulière (8 % par défaut).
async function square(buffer, size, fill = .84) {
  const trimmed = await sharp(buffer).trim({ threshold: 1 }).png().toBuffer();
  const inner = Math.round(size * fill), pad = Math.round((size - inner) / 2);
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
    // Le fond uni de l'icône est retiré : favicon transparent, icônes d'écran d'accueil sur fond crème.
    const cutout = await removeFlatBackground(file);
    for (const size of [32, 64]) await save(`favicon-${size}.png`, await square(cutout, size, .96), 'png');
    for (const size of [512, 192, 180]) await save(`app-icone-${size}.png`, (await square(cutout, size, .78)).flatten({ background: '#fff4df' }), 'png');
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
