// 'pack:nom' désigne une illustration du pack cartoon (public/assets/pack-cartoon), servie avec sa version 256 px pour les écrans haute densité.
// 'p2:nom' désigne une illustration du pack 2 (public/assets/pack-2), exportée par scripts/export-pack-2.mjs.
const assetSrc = name => name.startsWith('pack:') ? `/assets/pack-cartoon/${name.slice(5)}.webp` : name.startsWith('p2:') ? `/assets/pack-2/${name.slice(3)}.webp` : `/assets/${name}.webp`;
const assetSrcset = name => name.startsWith('pack:') ? `/assets/pack-cartoon/${name.slice(5)}-256.webp 2x` : name.startsWith('p2:') ? `/assets/pack-2/${name.slice(3)}-256.webp 2x` : '';
import pack2List from './pack-2.js';
export const asset = (name, className = '') => `<img class="game-asset ${className}" src="${assetSrc(name)}"${assetSrcset(name) ? ` srcset="${assetSrcset(name)}"` : ''} alt="" aria-hidden="true" width="40" height="40" decoding="async" draggable="false"/>`;
export const assetUrl = assetSrc;
// Illustration du pack 2 si elle a déjà été générée et exportée, sinon l'image de secours.
const pack2 = new Set(pack2List);
export const art = (id, fallback) => pack2.has(id) ? `p2:${id}` : fallback;
// Rues, navettes et taxe : une illustration propre à chaque case.
export const tileArtIds = {
  'Rue des Ateliers':'rue-ateliers', 'Passage des Artisans':'rue-artisans', 'Allée des Fresques':'rue-fresques', 'Place des Musiciens':'rue-musiciens', 'Quai des Inventeurs':'rue-inventeurs',
  'Rue des Lanternes':'rue-lanternes', 'Promenade des Livres':'rue-livres', 'Cour des Cinémas':'rue-cinemas', 'Boulevard des Saveurs':'rue-saveurs', 'Jardin des Épices':'rue-epices',
  'Avenue du Festival':'rue-festival', 'Place des Étoiles':'rue-etoiles', 'Rue des Studios':'rue-studios', 'Cours des Spectacles':'rue-spectacles', 'Avenue des Serres':'rue-serres',
  'Place du Soleil':'rue-soleil', 'Promenade des Verrières':'rue-verrieres', 'Quai des Horizons':'rue-horizons', 'Boulevard des Jardins':'rue-jardins', 'Terrasse du Phare':'rue-phare',
  'Allée des Nuages':'rue-nuages', 'Tour des Aurores':'rue-aurores',
  'Navette du Nord':'navette-nord', "Navette de l'Est":'navette-est', 'Navette du Sud':'navette-sud', "Navette de l'Ouest":'navette-ouest',
  'Contribution patrimoine':'taxe-patrimoine'
};
// Illustrations du pack cartoon, par rôle dans le jeu.
export const pack = {
  keys:'pack:objet-cles-propriete', hammer:'pack:objet-marteau-encheres', wallet:'pack:objet-portefeuille-billets', shield:'pack:objet-bouclier-loyer',
  coinRain:'pack:evenement-pluie-pieces', repairs:'pack:evenement-reparations-maison', party:'pack:evenement-fete-quartier', broke:'pack:evenement-faillite-tirelire',
  crown:'pack:recompense-couronne-vainqueur', medal:'pack:recompense-medaille-collection',
  house:'pack:batiment-maison-potager', apartments:'pack:batiment-immeuble-balcons', station:'pack:batiment-gare-train', bank:'pack:batiment-banque-coffre', prison:'pack:batiment-prison-evasion'
};
export const buildingAssets = { Cuivre:'copper-cottage', Azur:'blue-townhouse', Lavande:'lavender-bookshop', Corail:'coral-bakery', Rubis:'ruby-theater', Or:'gold-apartments', Émeraude:'emerald-greenhouse', Saphir:'sapphire-tower', Transport:'tram' };
const emojiAssets = {
  '🐸':'frog','🦊':'fox','🐼':'panda','🐙':'octopus','🐥':'chick','🐨':'koala',
  '🚀':'rocket','💌':'city-card','🎭':'event-card','💸':'tax','🚓':'police','🌴':'park','🚨':'siren','🚂':'tram','⚡':'power',
  '🏡':'pack:objet-cles-propriete','🏘️':'pack:recompense-medaille-collection','🏠':'pack:batiment-maison-potager','🏢':'pack:batiment-immeuble-balcons','🔨':'pack:objet-marteau-encheres','🎲':'dice-5','🤝':'handshake','🏆':'trophy','🥳':'trophy','🫣':'pack:evenement-faillite-tirelire','🍿':'frog','🔒':'mortgage',
  '⚀':'dice-1','⚁':'dice-2','⚂':'dice-3','⚃':'dice-4','⚄':'dice-5','⚅':'dice-6','⌂':'house'
};
const pattern = new RegExp(Object.keys(emojiAssets).join('|'), 'gu');

// Replace decorative glyphs only. Labels, buttons and keyboard controls stay real HTML.
export function decorateAssets(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) if (!['SCRIPT','STYLE'].includes(walker.currentNode.parentElement?.tagName)) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const matches = [...node.textContent.matchAll(pattern)];
    if (!matches.length) continue;
    const fragment = document.createDocumentFragment();
    let offset = 0;
    for (const match of matches) {
      fragment.append(document.createTextNode(node.textContent.slice(offset, match.index)));
      const image = document.createElement('img');
      const name = emojiAssets[match[0]];
      image.className = 'game-asset'; image.src = assetSrc(name); if (assetSrcset(name)) image.srcset = assetSrcset(name);
      image.alt = ''; image.setAttribute('aria-hidden','true'); image.width = 40; image.height = 40; image.draggable = false;
      fragment.append(image); offset = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(node.textContent.slice(offset)));
    node.replaceWith(fragment);
  }
}
