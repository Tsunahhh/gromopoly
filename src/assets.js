export const asset = (name, className = '') => `<img class="game-asset ${className}" src="/assets/${name}.webp" alt="" aria-hidden="true" width="40" height="40" decoding="async" draggable="false"/>`;
export const buildingAssets = { Cuivre:'copper-cottage', Azur:'blue-townhouse', Lavande:'lavender-bookshop', Corail:'coral-bakery', Rubis:'ruby-theater', Or:'gold-apartments', Émeraude:'emerald-greenhouse', Saphir:'sapphire-tower', Transport:'tram' };
const emojiAssets = {
  '🐸':'frog','🦊':'fox','🐼':'panda','🐙':'octopus','🐥':'chick','🐨':'koala',
  '🚀':'rocket','💌':'city-card','🎭':'event-card','💸':'tax','🚓':'police','🌴':'park','🚨':'siren','🚂':'tram','⚡':'power',
  '🏡':'house','🏘️':'house','🏠':'house','🏢':'apartment','🎲':'dice-5','🤝':'handshake','🏆':'trophy','🥳':'trophy','🫣':'tax','🍿':'frog','🔒':'mortgage',
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
      image.className = 'game-asset'; image.src = `/assets/${emojiAssets[match[0]]}.webp`;
      image.alt = ''; image.setAttribute('aria-hidden','true'); image.width = 40; image.height = 40; image.draggable = false;
      fragment.append(image); offset = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(node.textContent.slice(offset)));
    node.replaceWith(fragment);
  }
}
