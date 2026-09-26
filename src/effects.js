import { asset, pack } from './assets.js';

// Effets visuels déclenchés par un changement d'état de la partie.
// Tout est calculé en comparant l'état précédent et le nouvel état : chaque joueur voit donc les mêmes effets.

export const faces = ['frog', 'fox', 'panda', 'octopus', 'chick', 'koala'];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = value => `${Math.round(value).toLocaleString('fr-FR')} ¤`;
const STEP = 190; // durée d'un saut de case (ms)

// Nouvelles lignes du journal, dans l'ordre chronologique.
function newLogEntries(before, after) {
  const count = (after.log?.length || 0) - (before.log?.length || 0);
  return count > 0 ? after.log.slice(0, count).reverse() : [];
}

function fxLayer() {
  let layer = document.querySelector('.fx-layer');
  if (!layer) { layer = document.createElement('div'); layer.className = 'fx-layer'; layer.setAttribute('aria-hidden', 'true'); document.body.append(layer); }
  return layer;
}

function visibleCenter(el) {
  const r = el?.getBoundingClientRect();
  if (!r || !r.width) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// ---------- Déplacements, pièces, cases ----------

// Renvoie la durée (ms) avant que tout soit « posé », pour synchroniser annonces et cartes.
export function playTransition(before, after, { anim, startDelay = 0 }) {
  if (!anim || !before?.players || after?.status !== 'playing') return 0;
  const board = document.querySelector('.board'), tiles = board?.querySelectorAll('.tile');
  if (!board || tiles.length !== 40) return 0;
  const boardVisible = board.getBoundingClientRect().width > 0;
  const center = index => { const b = board.getBoundingClientRect(), r = tiles[index].getBoundingClientRect(); return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 }; };
  let travel = 0;
  if (boardVisible) after.players.forEach((player, i) => {
    const previous = before.players.find(p => p.id === player.id);
    if (previous?.pos == null || previous.pos === player.pos || player.bankrupt) return;
    const distance = (player.pos - previous.pos + 40) % 40, jump = (player.jailed && player.pos === 10) || distance > 16;
    const path = jump ? [previous.pos, player.pos] : Array.from({ length: distance + 1 }, (_, k) => (previous.pos + k) % 40);
    const duration = jump ? 900 : STEP * (path.length - 1);
    const real = board.querySelector(`.pawns i[data-player="${CSS.escape(player.id)}"]`);
    if (real) real.style.visibility = 'hidden';
    const token = document.createElement('span');
    token.className = 'travel-token';
    token.style.setProperty('--pawn', player.color);
    token.innerHTML = asset(faces[i]);
    board.append(token);
    const hop = jump ? Math.min(140, board.clientWidth / 4) : Math.max(10, tiles[0].clientWidth * .45);
    const frames = [];
    path.forEach((index, k) => {
      const p = center(index), offset = k / (path.length - 1);
      if (k > 0) { const q = center(path[k - 1]); frames.push({ offset: (k - .5) / (path.length - 1), transform: `translate(${(p.x + q.x) / 2}px, ${(p.y + q.y) / 2 - hop}px) scale(1.18)` }); }
      frames.push({ offset, transform: `translate(${p.x}px, ${p.y}px) scale(${k === path.length - 1 ? 1.1 : .95})` });
    });
    const motion = token.animate(frames, { duration, delay: startDelay, easing: 'linear', fill: 'both' });
    motion.onfinish = () => { token.remove(); if (real?.isConnected) { real.style.visibility = ''; real.classList.add('landed'); } };
    travel = Math.max(travel, duration);
  });
  const settle = startDelay + travel;
  setTimeout(() => settleEffects(before, after), settle);
  return settle + 250;
}

function settleEffects(before, after) {
  const board = document.querySelector('.board'), tiles = board?.querySelectorAll('.tile');
  // Cases modifiées : achat, construction, hypothèque.
  if (tiles?.length === 40) after.board.forEach((tile, index) => {
    const old = before.board?.[index]; if (!old) return;
    const el = tiles[index], owner = after.players.find(p => p.id === tile.owner);
    let icon = null;
    if (tile.owner && tile.owner !== old.owner) icon = pack.keys;
    else if (tile.level > old.level) icon = tile.level === 4 ? pack.apartments : pack.house;
    else if (tile.mortgage && !old.mortgage) icon = 'mortgage';
    else if (tile.owner !== old.owner || tile.level !== old.level || tile.mortgage !== old.mortgage) icon = '';
    if (icon === null) return;
    el.style.setProperty('--flash', owner?.color || '#8b67cf');
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    if (icon) {
      const b = board.getBoundingClientRect(), r = el.getBoundingClientRect(), pop = document.createElement('span');
      pop.className = 'tile-pop'; pop.innerHTML = asset(icon);
      pop.style.left = `${r.left - b.left + r.width / 2}px`; pop.style.top = `${r.top - b.top + r.height / 2}px`;
      board.append(pop); setTimeout(() => pop.remove(), 1600);
    }
  });
  // Argent : compteur qui défile, montant qui s'envole, pièces qui volent entre joueurs et banque.
  const cards = document.querySelectorAll('.players-rail .player-card');
  after.players.forEach((player, index) => {
    const previous = before.players.find(p => p.id === player.id), card = cards[index];
    const diff = Math.round(player.cash - (previous?.cash ?? player.cash));
    if (!diff || !card) return;
    tweenCash(card.querySelector('.cash-value'), previous.cash, player.cash);
    card.classList.remove('cash-up', 'cash-down'); void card.offsetWidth; card.classList.add(diff > 0 ? 'cash-up' : 'cash-down');
    const pop = document.createElement('span');
    pop.className = 'cash-pop ' + (diff > 0 ? 'gain' : 'loss');
    pop.innerHTML = `${diff > 0 ? asset(pack.coinRain) : ''}<b>${diff > 0 ? '+' : '−'}${money(Math.abs(diff))}</b>`;
    card.append(pop); setTimeout(() => pop.remove(), 2200);
  });
  flyTransfers(before, after, cards);
}

function tweenCash(el, from, to) {
  if (!el) return;
  const start = performance.now(), duration = 900;
  const frame = now => { const t = Math.min(1, (now - start) / duration), eased = 1 - Math.pow(1 - t, 3); el.textContent = money(from + (to - from) * eased); if (t < 1 && el.isConnected) requestAnimationFrame(frame); };
  el.textContent = money(from); requestAnimationFrame(frame);
}

// Qui paie qui : lu dans les nouvelles lignes du journal.
function transfers(before, after) {
  const byName = name => after.players.findIndex(p => p.name === name), list = [];
  for (const { text } of newLogEntries(before, after)) {
    let m;
    if ((m = text.match(/^(.+?) paie (\d+) ¤(?: à (.+?))?(?: ·|\.|$)/))) list.push({ from: byName(m[1]), to: m[3] ? byName(m[3]) : -1 });
    else if ((m = text.match(/^(.+?) (?:achète|construit sur) .+ pour \d+ ¤/)) || (m = text.match(/^(.+?) remporte .+ pour \d+ ¤/))) list.push({ from: byName(m[1]), to: -1 });
    else if ((m = text.match(/^(.+?) (?:passe par le Départ et reçoit|hypothèque)/))) list.push({ from: -1, to: byName(m[1]) });
  }
  return list.filter(t => t.from !== t.to && (t.from >= 0 || t.to >= 0));
}

function flyTransfers(before, after, cards) {
  const bank = visibleCenter(document.querySelector('.bank-pill')) || { x: innerWidth / 2, y: innerHeight / 2 };
  const point = index => index < 0 ? bank : visibleCenter(cards[index]) || bank;
  const layer = fxLayer();
  transfers(before, after).slice(0, 4).forEach((t, n) => {
    const a = point(t.from), b = point(t.to), lift = Math.min(160, Math.hypot(b.x - a.x, b.y - a.y) / 2 + 40);
    for (let i = 0; i < 6; i++) {
      const coin = document.createElement('span');
      coin.className = 'fly-coin'; coin.innerHTML = asset('coins');
      layer.append(coin);
      const jitter = (i - 2.5) * 6;
      coin.animate([
        { transform: `translate(${a.x}px, ${a.y}px) scale(.4)`, opacity: 0 },
        { offset: .15, transform: `translate(${a.x + jitter}px, ${a.y - 10}px) scale(1)`, opacity: 1 },
        { offset: .55, transform: `translate(${(a.x + b.x) / 2 + jitter}px, ${Math.min(a.y, b.y) - lift}px) scale(1.2)`, opacity: 1 },
        { transform: `translate(${b.x}px, ${b.y}px) scale(.6)`, opacity: .9 }
      ], { duration: 950, delay: n * 350 + i * 70, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'both' }).onfinish = () => coin.remove();
    }
    const target = t.to >= 0 ? cards[t.to] : document.querySelector('.bank-pill');
    setTimeout(() => { if (!target?.isConnected) return; target.classList.remove('receive'); void target.offsetWidth; target.classList.add('receive'); }, n * 350 + 950);
  });
}

// ---------- Annonces : grandes bulles lisibles sur PC comme sur mobile ----------

const RULES = [
  [/ achète | remporte /, pack.keys, 'buy'],
  [/ paie /, 'coins', 'pay'],
  [/reçoit 200/, pack.coinRain, 'good'],
  [/construit/, pack.house, 'buy'],
  [/hypothèque/, 'mortgage', 'neutral'],
  [/ doit /, pack.broke, 'bad'],
  [/faillite/, pack.broke, 'bad'],
  [/envoyé au Commissariat|trois doubles|reste au Commissariat/, pack.prison, 'bad'],
  [/sort du Commissariat|carte Libération/, pack.shield, 'good'],
  [/règle sa dette/, pack.wallet, 'good'],
  [/concluent un échange/, 'handshake', 'good'],
  [/propose un échange/, 'handshake', 'neutral'],
  [/Aucune mise|Enchère annulée/, pack.hammer, 'neutral'],
  [/Partie terminée/, pack.crown, 'good']
];

function highlight(text, players) {
  let html = esc(text);
  for (const p of [...players].sort((a, b) => b.name.length - a.name.length)) html = html.split(esc(p.name)).join(`<b class="who" style="--c:${p.color}">${esc(p.name)}</b>`);
  return html.replace(/(\d[\d\s ]*) ¤/g, '<strong>$1 ¤</strong>');
}

export function announce(before, after, { me, delay = 0 }) {
  if (!before?.players || !after?.players || after.status === 'lobby') return;
  const items = [];
  for (const { text } of newLogEntries(before, after)) {
    const rule = RULES.find(([re]) => re.test(text));
    if (rule) items.push({ icon: rule[1], tone: rule[2], html: highlight(text, after.players) });
  }
  const active = after.players[after.turn], wasActive = before.players[before.turn];
  if (after.status === 'playing' && active && (active.id !== wasActive?.id || after.round !== before.round)) {
    const index = after.players.indexOf(active);
    items.push({ icon: faces[index], tone: 'turn', accent: active.color, html: active.id === me?.id ? '<b>À toi de jouer !</b>' : `Au tour de ${highlight(active.name, after.players)}` });
  }
  items.slice(-4).forEach((item, n) => setTimeout(() => showAnnouncement(item), delay + n * 650));
}

function showAnnouncement({ icon, tone, html, accent }) {
  let box = document.querySelector('.announcer');
  if (!box) { box = document.createElement('div'); box.className = 'announcer'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.append(box); }
  while (box.children.length >= 3) box.firstElementChild.remove();
  const el = document.createElement('div');
  el.className = `announce tone-${tone}`;
  if (accent) el.style.setProperty('--accent', accent);
  el.innerHTML = `${asset(icon)}<p>${html}</p>`;
  el.onclick = () => el.remove();
  box.append(el);
  setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 350); }, 3200);
}
