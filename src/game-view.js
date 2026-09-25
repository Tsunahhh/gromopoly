import { groups } from './board.js';
import { RENT_MULTIPLIERS } from './engine.js';
import { asset, buildingAssets, pack } from './assets.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = value => `${Math.round(value).toLocaleString('fr-FR')} ¤`;
const faces = ['🐸', '🦊', '🐼', '🐙', '🐥', '🐨'];
const symbols = { start: '🚀', city: '💌', event: '🎭', tax: '💸', jail: '🚓', rest: '🌴', gotojail: '🚨' };
const worth = (s, p) => p.cash + s.board.filter(t => t.owner === p.id).reduce((n, t) => n + t.price + (t.build || 0) * t.level / 2 - (t.mortgage ? t.price / 2 : 0), 0);
const owned = (s, id) => s.board.map((t, index) => ({ ...t, index })).filter(t => t.owner === id);
const activePlayer = s => s.players.find(p => p.id === (s.phase === 'debt' ? s.pendingDebt?.debtor : s.phase === 'auction' ? s.auctionActor : s.players[s.turn]?.id));
const button = (id, text, disabled = false, secondary = false) => `<button id="${id}" class="btn ${secondary ? 'outline' : 'gold'}" ${disabled ? 'disabled' : ''}>${text}</button>`;

const tileArt = t => t.group === 'Transport' ? pack.station : t.group === 'Service' ? (/d['’]eau/.test(t.name) ? 'water' : 'power') : buildingAssets[t.group] || 'house';
const leaderId = s => { const alive = s.players.filter(p => !p.bankrupt); if (alive.length < 2) return null; const ranked = alive.map(p => [p.id, worth(s, p)]).sort((a, b) => b[1] - a[1]); return ranked[0][1] > ranked[1][1] ? ranked[0][0] : null; };

function position(i) {
  if (i <= 10) return [11, 11 - i];
  if (i <= 20) return [21 - i, 1];
  if (i <= 30) return [1, i - 19];
  return [i - 29, 11];
}

function tileMarkup(s, t, index, active) {
  const [row, col] = position(index), owner = s.players.find(p => p.id === t.owner);
  const icon = symbols[t.type] || (t.group === 'Service' ? asset(/d['’]eau/.test(t.name) ? 'water' : 'power') : asset(buildingAssets[t.group] || 'house'));
  const pawns = s.players.filter(p => !p.bankrupt && p.pos === index);
  return `<button class="tile ${t.type} ${pawns.length ? 'occupied' : ''} ${active?.pos === index ? 'current' : ''} ${t.mortgage ? 'mortgaged' : ''}" data-tile-card="${index}" style="grid-row:${row};grid-column:${col};--group:${groups[t.group] || '#b7cdd5'}" aria-label="${esc(t.name)}${t.price ? `, ${t.price} pièces` : ''}${owner ? `, appartient à ${esc(owner.name)}` : ''}" title="Voir ${esc(t.name)}">
    <span class="tile-band">${owner ? `<span class="tile-owner" style="background:${owner.color}">${esc(owner.name.slice(0, 1))}</span>` : ''}</span>
    <span class="tile-content">${icon ? `<span class="tile-icon" aria-hidden="true">${icon}</span>` : ''}<span class="tile-name">${esc(t.name)}</span>${t.price ? `<span class="tile-price">${money(t.price)}</span>` : ''}${t.level ? `<span class="houses" aria-label="Niveau ${t.level}">${t.level === 4 ? '🏢' : '⌂'.repeat(t.level)}</span>` : ''}<span class="pawns">${pawns.map(p => `<i style="--pawn:${p.color}" title="${esc(p.name)}">${faces[s.players.indexOf(p)]}</i>`).join('')}</span></span>
  </button>`;
}

function actionMarkup(s, me) {
  const active = activePlayer(s), mine = active?.id === me.id;
  if (!mine) return `<div class="turn-instruction"><span class="action-emoji">🍿</span><div><h2>${esc(active?.name)} prépare son coup…</h2><p>En attendant, clique sur une case pour regarder les prix et les loyers.</p></div></div><span class="waiting-pill">À ton tour bientôt</span>`;
  if (s.phase === 'debt') {
    const debt = s.pendingDebt, creditor = s.players.find(p => p.id === debt.creditor)?.name || 'la banque';
    return `<div class="turn-instruction"><span class="action-emoji">🫣</span><div><h2>Oups. Une facture de ${money(debt.amount)} !</h2><p>À payer à ${esc(creditor)}. Ouvre un de tes terrains pour vendre ou hypothéquer.</p></div></div><div class="action-buttons">${button('debt-settle', `${asset(pack.wallet)} Régler la dette`, active.cash < debt.amount)}${button('debt-bankrupt', 'Déclarer faillite', false, true)}</div>`;
  }
  if (s.phase === 'auction') {
    const a = s.auction, next = a.highBid ? a.highBid + 10 : 1;
    return `<div class="turn-instruction"><span class="action-emoji">🔨</span><div><h2>Qui veut ${esc(s.board[a.tile].name)} ?</h2><p>${a.highBid ? `Offre en tête : ${money(a.highBid)}. ` : 'Les enchères sont ouvertes. '}Tu as ${money(active.cash)}.</p></div></div><div class="action-buttons"><label class="bid-label" for="bid-amount">Ta mise<input id="bid-amount" type="number" min="${next}" max="${active.cash}" value="${next}" step="1"/></label>${button('bid', 'Je surenchéris !', active.cash < next)}${button('auction-pass', 'Je passe', false, true)}</div>`;
  }
  if (s.phase === 'decision') {
    const t = s.board[s.pending.tile];
    return `<div class="turn-instruction"><span class="action-emoji">🏡</span><div><h2>${esc(t.name)} est à vendre !</h2><p>${money(t.price)} · ${esc(t.group)}${active.cash < t.price ? ' · Ton porte-monnaie est trop léger.' : ` · Il te restera ${money(active.cash - t.price)}.`}</p></div></div><div class="action-buttons">${button('buy', `Acheter · ${money(t.price)}`, active.cash < t.price)}${button('pass', 'Mettre aux enchères', false, true)}</div>`;
  }
  if (s.phase === 'roll' && active.jailed) return `<div class="turn-instruction"><span class="action-emoji">${asset(pack.prison)}</span><div><h2>Petit séjour au poste.</h2><p>Tente un double, paie 50 ¤ ou utilise une carte Libération. Tentative ${(active.jailAttempts || 0) + 1}/3.</p></div></div><div class="action-buttons">${button('roll', 'Tenter un double 🎲')}${button('bail', `${asset(pack.wallet)} Sortir · 50 ¤`, active.cash < 50, true)}${active.releaseCards ? button('release', `${asset(pack.shield)} Utiliser Libération`, false, true) : ''}</div>`;
  if (s.phase === 'roll') return `<div class="turn-instruction"><span class="action-emoji">🎲</span><div><h2>À toi de jouer, ${esc(active.name)} !</h2><p>Deux dés. Quarante cases. Un petit empire à construire.</p></div></div>${button('roll', 'Lancer les dés 🎲')}`;
  if (s.phase === 'bonus') return `<div class="turn-instruction"><span class="action-emoji">🥳</span><div><h2>Un double ! La chance insiste.</h2><p>Tu peux gérer tes terrains avant de relancer.</p></div></div>${button('end', 'Rejouer 🎲')}`;
  return `<div class="turn-instruction"><span class="action-emoji">🤝</span><div><h2>Un dernier petit coup de génie ?</h2><p>Construis, négocie ou passe la main à ton voisin.</p></div></div>${button('end', 'Terminer mon tour →')}`;
}

export function gameMarkup({ state: s, me, roomCode, clock, anim }) {
  const active = activePlayer(s), properties = owned(s, me.id), leader = leaderId(s);
  const colorGroups = Object.keys(groups).filter(g => !['Service', 'Transport'].includes(g));
  return `<main class="game-page">
    <header class="game-top"><a class="wordmark" href="#" id="game-logo">CITÉ <em>CAPITALE</em><span class="logo-die">⚄</span></a><div class="room-pill">SALON <b>${esc(roomCode)}</b><button id="copy-game" aria-label="Copier le code du salon">Copier</button></div><div class="game-clock"><span>Tour ${s.round + 1}</span><b id="turn-countdown">${esc(clock)}</b></div><button class="icon-button" id="exit-game" aria-label="Retour à l’accueil">⌂</button></header>
    <section class="turn-banner ${active?.id === me.id ? 'your-turn' : ''}" aria-label="Action du tour">${actionMarkup(s, me)}</section>
    <div class="game-layout">
      <aside class="players-rail"><div class="section-head"><span>LA BANDE</span><span>${s.players.length} joueurs</span></div>${s.players.map((p, i) => `<article class="player-card ${active?.id === p.id ? 'active' : ''} ${p.bankrupt ? 'bankrupt' : ''}" style="--accent:${p.color}"><div class="player-avatar" aria-hidden="true">${faces[i]}${leader === p.id ? asset(pack.crown, 'leader-crown') : ''}</div><div class="player-meta"><b>${esc(p.name)} ${p.id === me.id ? '<small>TOI</small>' : ''}</b><strong>${asset("coins","inline-coin")}${money(p.cash)}</strong><small>${p.bankrupt ? 'En faillite' : `${money(worth(s, p))} de patrimoine`}</small>${p.bankrupt || p.jailed || p.releaseCards || leader === p.id ? `<span class="player-status">${leader === p.id ? `<i>${asset(pack.crown)}En tête</i>` : ''}${p.bankrupt ? `<i>${asset(pack.broke)}Fauché</i>` : ''}${p.jailed ? `<i>${asset(pack.prison)}Au poste</i>` : ''}${p.releaseCards ? `<i title="Carte Libération">${asset(pack.shield)}×${p.releaseCards}</i>` : ''}</span>` : ''}</div>${active?.id === p.id ? '<span class="turn-dot" title="Joue actuellement"></span>' : ''}</article>`).join('')}
      <div class="goal-card"><span class="sticker">🏘️</span><h3>Un quartier, ça se complète !</h3><p>Réunis une couleur pour construire. Les voisins sont ouverts à la négociation… en principe.</p><div class="group-progress">${colorGroups.map(g => { const all = s.board.filter(t => t.group === g), n = all.filter(t => t.owner === me.id).length; const done = n === all.length; return `<div class="${done ? 'done' : ''}" title="${esc(g)} : ${n} sur ${all.length}${done ? ' · quartier complet' : ''}"><i style="background:${groups[g]}"></i><span>${esc(g)}</span>${done ? asset(pack.medal, 'group-medal') : ''}<b>${n}/${all.length}</b></div>`; }).join('')}</div></div>
      <div class="game-tools">${button('rules', '📖 Comment on joue ?', false, true)}<button id="motion" class="btn outline" aria-pressed="${anim}">${anim ? '✨' : '◌'} Animations ${anim ? 'activées' : 'désactivées'}</button></div></aside>
      <section class="board-wrap"><div class="board" aria-label="Plateau de jeu">${s.board.map((t, i) => tileMarkup(s, t, i, active)).join('')}<div class="board-center"><span class="board-ribbon">LES AFFAIRES SONT UNE AFFAIRE DE POTES.</span><div class="center-word">CITÉ<br/><em>CAPITALE</em></div><p class="center-sub">Les loyers montent. Les amitiés résistent.</p>${active ? `<p class="center-where"><b>${esc(active.name)}</b> est sur ${esc(s.board[active.pos]?.name)}</p>` : ''}<div class="dice-area ${s.lastRoll ? '' : 'idle'}">${(s.lastRoll || [1, 5]).map(n => `<span class="die" aria-label="Dé : ${n}">${['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][n]}</span>`).join('')}</div><div class="bank-pill" title="Réserve de la banque">${asset(pack.bank, 'bank-icon')}🏠 ${s.bank.houses} <span>·</span> 🏢 ${s.bank.apartments}<small>en réserve</small></div><small class="board-hint">Clique sur une case pour tout savoir ↗</small></div></div></section>
      <aside class="activity-rail"><section class="property-panel"><div class="section-head"><span>MES TERRAINS</span><b>${properties.length}</b></div><p class="panel-help">Clique pour construire ou gérer.</p>${properties.length ? properties.map(t => `<button class="property-button" data-tile-card="${t.index}" style="--group:${groups[t.group]}"><i></i><span><b>${esc(t.name)}</b><small>${t.mortgage ? 'Hypothéqué' : t.level ? `Niveau ${t.level} · ${t.level === 4 ? 'Immeuble' : 'Maisons'}` : esc(t.group)}</small></span><span>↗</span></button>`).join('') : '<div class="empty-property"><span>🏡</span><b>À toi le premier terrain !</b><p>Achète une case libre après ton lancer.</p></div>'}</section><section class="journal-panel"><div class="journal-head"><div class="section-head">LE PETIT JOURNAL</div><span class="live"><i></i> En direct</span></div><div class="journal">${s.log.slice(0, 12).map((entry, i) => `<div class="log-line ${i === 0 ? 'fresh' : ''}"><span>${esc(entry.icon)}</span><p>${esc(entry.text)}</p></div>`).join('')}</div></section></aside>
    </div></main>`;
}

export function propertyMarkup(s, me, index) {
  const t = s.board[index], owner = s.players.find(p => p.id === t.owner);
  if (!t) return '';
  if (t.type !== 'street') {
    const explanations = { start: 'Passe par ici et empoche 200 ¤. Le meilleur rond-point de la ville.', city: 'Une carte municipale : parfois une prime, parfois une facture. La mairie aime les surprises.', event: 'Pioche un événement. La ville a toujours un petit rebondissement en réserve.', tax: `La banque réclame ${money(t.amount)}. Elle n’accepte pas les « je te rembourse demain ».`, jail: 'En visite ? Tout va bien. Retenu ? Un double, 50 ¤ ou une carte Libération te permettront de sortir.', rest: 'Une pause au parc. Zéro facture, zéro jackpot, juste de l’air frais.', gotojail: 'Direction le Commissariat, sans passer par le Départ. Pas de prime de 200 ¤.' };
    return `<div class="info-hero">${t.type === 'jail' ? asset(pack.prison) : symbols[t.type]}</div><h2>${esc(t.name)}</h2><p>${explanations[t.type]}</p>`;
  }
  const siblings = s.board.filter(x => x.group === t.group), mine = t.owner === me.id, p = s.players.find(x => x.id === me.id);
  const manage = mine && s.players[s.turn]?.id === me.id && ['roll', 'end', 'bonus'].includes(s.phase);
  const debt = mine && s.phase === 'debt' && s.pendingDebt?.debtor === me.id;
  const buildable = t.build && siblings.every(x => x.owner === me.id && !x.mortgage) && t.level < 4 && t.level === Math.min(...siblings.map(x => x.level)) && p.cash >= t.build && (t.level === 3 ? s.bank.apartments > 0 : s.bank.houses > 0);
  const canSell = t.level > 0 && t.level === Math.max(...siblings.map(x => x.level)) && (t.level !== 4 || s.bank.houses >= 3);
  const noBuildings = siblings.every(x => !x.level);
  const action = (cmd, label, enabled) => `<button class="btn outline" data-property-action="${cmd}" data-property-index="${index}" ${enabled ? '' : 'disabled'}>${label}</button>`;
  return `<div class="deed-stripe" style="background:${groups[t.group]}">${esc(t.group)}${asset(tileArt(t), 'deed-art')}</div><h2>${esc(t.name)}</h2><p class="owner-label">${owner ? `Propriétaire : ${esc(owner.name)}` : 'Ce terrain attend son futur propriétaire.'}${t.mortgage ? ' · Hypothéqué' : ''}</p><div class="deed-facts"><div><small>Prix d’achat</small><b>${money(t.price)}</b></div><div><small>Construction</small><b>${t.build ? money(t.build) : 'Aucune'}</b></div></div>
    ${t.build ? `<table class="rent-table"><caption>Loyers à encaisser${t.mortgage ? ' · suspendus pendant l’hypothèque' : ''}</caption><tbody>${[0, 1, 2, 3, 4].map(level => `<tr class="${level === t.level ? 'current-level' : ''}"><th scope="row"><span class="level-icons">${level === 4 ? asset(pack.apartments) : asset(pack.house).repeat(level)}</span>${['Terrain nu', '1 maison', '2 maisons', '3 maisons', 'Immeuble'][level]}</th><td>${money(level ? Math.round(t.rent * RENT_MULTIPLIERS[level] / 10) * 10 : t.rent)}</td></tr>`).join('')}</tbody></table><p class="small-note">Le terrain nu rapporte le double si le groupe complet est détenu sans hypothèque.</p>` : `<p class="special-rent">${t.group === 'Transport' ? '1 / 2 / 3 / 4 navettes actives : 25 / 50 / 100 / 200 ¤ de loyer.' : '1 service actif : 4 × les dés. Les 2 services : 10 × les dés.'}</p>`}
    ${manage ? `<div class="property-actions">${t.build ? action('build', `🏠 Construire · ${money(t.build)}`, buildable) : ''}${t.level ? action('sellhouse', `Vendre un niveau · +${money(t.build / 2)}`, canSell) : ''}${t.mortgage ? action('redeem', `Lever l’hypothèque · ${money(Math.ceil(t.price * .55))}`, p.cash >= Math.ceil(t.price * .55)) : action('mortgage', `🔒 Hypothéquer · +${money(t.price / 2)}`, noBuildings)}</div><p class="small-note">Pour construire : groupe complet, niveaux équilibrés et bâtiments disponibles.</p>` : debt ? `<div class="property-actions">${action('debt-mortgage', `Hypothéquer · +${money(t.price / 2)}`, !t.mortgage && noBuildings)}${action('debt-sell', t.level ? `Vendre un niveau · +${money(t.build / 2)}` : `Vendre le titre · +${money(t.mortgage ? 0 : t.price / 2)}`, t.level ? canSell : true)}</div>` : mine ? '<p class="small-note">Tu pourras gérer ce terrain pendant ton tour, avant le lancer ou après le déplacement.</p>' : ''}`;
}

export const rulesMarkup = `<div class="info-hero">🎲</div><h2>Le plan pour devenir riche.</h2><ol class="rules-list"><li><b>Lance les dés.</b> Ton pion avance. Un passage au Départ rapporte 200 ¤.</li><li><b>Achète ou négocie.</b> Un terrain libre s’achète au prix affiché ou part aux enchères.</li><li><b>Complète une couleur.</b> Tous les terrains d’une couleur permettent de construire, à niveaux équilibrés.</li><li><b>Encaisse… et paie.</b> Chez un autre joueur, tu paies le loyer. Garde une petite réserve !</li><li><b>Vise le plus gros patrimoine.</b> À la fin du temps, argent et actifs départagent les joueurs. Les points restent sur ton pseudo.</li></ol><p class="small-note">Astuce : clique sur les cases pour comparer les loyers, et utilise « Échanger » pour négocier avec tes potes. Raccourci : la touche R lance les dés.</p>`;
