// 'pack:nom' désigne une illustration du pack cartoon (public/assets/pack-cartoon), servie avec sa version 256 px pour les écrans haute densité.
const assetSrc = name => name.startsWith('pack:') ? `/assets/pack-cartoon/${name.slice(5)}.webp` : `/assets/${name}.webp`;
const assetSrcset = name => name.startsWith('pack:') ? `/assets/pack-cartoon/${name.slice(5)}-256.webp 2x` : '';
export const asset = (name, className = '') => `<img class="game-asset ${className}" src="${assetSrc(name)}"${assetSrcset(name) ? ` srcset="${assetSrcset(name)}"` : ''} alt="" aria-hidden="true" width="40" height="40" decoding="async" draggable="false"/>`;
export const assetUrl = assetSrc;
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
