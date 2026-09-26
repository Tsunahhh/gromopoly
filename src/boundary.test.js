import test from 'node:test';
import assert from 'node:assert/strict';
import { BOARD, CARDS, groups } from './board.js';
import { applyCommand, createGame, RENT_MULTIPLIERS, ECONOMY } from './engine.js';

const START = ECONOMY.startCash;
import { simulate } from '../scripts/balance.mjs';

const makePlayers = count => Array.from({ length: count }, (_, i) => ({ id: `p${i}`, name: `Joueur ${i + 1}` }));
const game = (count = 2, seed = 42) => createGame(makePlayers(count), 60, { seed });
const land = (s, index, dice = [1, 1]) => {
  s.players[s.turn].pos = (index - dice[0] - dice[1] + 40) % 40;
  return applyCommand(s, s.players[s.turn].id, 'roll', {}, dice);
};

test('configuration de plateau : 40 cases et 24 cartes uniques', () => {
  assert.equal(BOARD.length, 40);
  assert.equal(CARDS.event.length + CARDS.city.length, 24);
  assert.equal(new Set(BOARD.filter(t => t.type === 'street').map(t => t.name)).size, 28);
});

for (const [index, tile] of BOARD.entries()) {
  test(`case ${index.toString().padStart(2, '0')} : données et état initial valides`, () => {
    const s = game();
    const actual = s.board[index];
    assert.equal(actual.name, tile.name);
    assert.equal(actual.type, tile.type);
    assert.equal(actual.owner, null);
    assert.equal(actual.mortgage, false);
    assert.equal(actual.level, 0);
    if (tile.type === 'street') {
      assert.ok(tile.price > 0 && Number.isInteger(tile.price));
      assert.ok(tile.rent >= 0 && Number.isInteger(tile.rent));
      assert.ok(groups[tile.group]);
      if (!['Transport', 'Service'].includes(tile.group)) assert.ok(tile.build > 0);
    }
    if (tile.type === 'tax') assert.ok(tile.amount > 0);
  });
}

for (const [deckName, cards, landing] of [['event', CARDS.event, 7], ['city', CARDS.city, 2]]) {
  for (const [index, card] of cards.entries()) {
    test(`${deckName} ${index + 1} : ${card[0]} applique son effet et retourne au fond`, () => {
      const s = game(3);
      const deck = deckName === 'event' ? s.eventDeck : s.cityDeck;
      deck.splice(0, deck.length, [...card], ...cards.filter((_, i) => i !== index).map(c => [...c]));
      const p = s.players[0], startCash = p.cash;
      land(s, landing);
      assert.deepEqual(deck.at(-1), card);
      const [kind, value] = card[1].split(':');
      if (kind === 'cash') assert.equal(p.cash, startCash + Number(value));
      else if (kind === 'repairs') assert.equal(p.cash, startCash);
      else if (kind === 'payeach') assert.equal(p.cash, startCash + Number(value) * 2);
      else if (kind === 'collect') assert.equal(p.cash, startCash - Number(value) * 2);
      else if (kind === 'release') assert.equal(p.releaseCards, 1);
      else if (kind === 'jail') { assert.equal(p.pos, 10); assert.equal(p.jailed, 1); }
      else if (kind === 'go-start') { assert.equal(p.pos, 0); assert.equal(p.cash, startCash + ECONOMY.goSalary); }
      else if (kind === 'nearest-transport') assert.equal(p.pos, 15);
      else if (kind === 'back') assert.equal(p.pos, 5);
      else if (kind === 'go') assert.equal(p.pos, Number(value));
      else assert.fail(`Unknown card effect: ${kind}`);
      assert.ok(p.cash >= 0);
    });
  }
}

const ordinaryStreets = BOARD.map((t, index) => ({ ...t, index })).filter(t => t.type === 'street' && !['Transport', 'Service'].includes(t.group));
for (const tile of ordinaryStreets) {
  for (const level of [0, 4]) {
    test(`loyer ${tile.name} niveau ${level} : transfert exact à la limite`, () => {
      const s = game();
      s.players[0].cash = 10000;
      s.players[1].cash = 10000;
      s.board[tile.index].owner = 'p1';
      s.board[tile.index].level = level;
      const fee = level === 0 ? tile.rent : Math.round(tile.rent * RENT_MULTIPLIERS[level] / 10) * 10;
      const before = s.players[0].cash;
      const previous = (tile.index - 2 + 40) % 40;
      land(s, tile.index);
      assert.equal(s.players[0].cash, before + (previous > tile.index ? ECONOMY.goSalary : 0) - fee);
      assert.equal(s.players[1].cash, 10000 + fee);
      assert.equal(s.phase, 'bonus');
    });
  }
}

for (const invalid of [[0, 1], [7, 1], [1, 0], [1, 7], [1], [1, 2, 3], [1.5, 2], ['1', 2], null]) {
  test(`dés invalides ${JSON.stringify(invalid)}`, () => {
    const s = game();
    assert.throws(() => applyCommand(s, 'p0', 'roll', {}, invalid), /Dés invalides/);
    assert.equal(s.players[0].pos, 0);
  });
}

for (const tileIndex of [1, 19, 39]) {
  test(`achat ${BOARD[tileIndex].name} : un ¤ insuffisant`, () => {
    const s = game();
    s.phase = 'decision'; s.pending = { type: 'buy', tile: tileIndex };
    s.players[0].cash = BOARD[tileIndex].price - 1;
    assert.throws(() => applyCommand(s, 'p0', 'buy'), /Fonds insuffisants/);
    assert.equal(s.board[tileIndex].owner, null);
  });
  test(`achat ${BOARD[tileIndex].name} : montant exact`, () => {
    const s = game();
    s.phase = 'decision'; s.pending = { type: 'buy', tile: tileIndex };
    s.players[0].cash = BOARD[tileIndex].price;
    applyCommand(s, 'p0', 'buy');
    assert.equal(s.players[0].cash, 0);
    assert.equal(s.board[tileIndex].owner, 'p0');
    assert.equal(s.players[0].stats.purchases, 1);
  });
}

for (const seed of Array.from({ length: 24 }, (_, i) => i)) {
  test(`graine ${seed} : paquets et partie rejouables`, () => {
    const a = game(4, seed), b = game(4, seed);
    assert.deepEqual(a.eventDeck, b.eventDeck);
    assert.deepEqual(a.cityDeck, b.cityDeck);
    assert.equal(new Set(a.eventDeck.map(c => c[0])).size, 12);
    assert.equal(new Set(a.cityDeck.map(c => c[0])).size, 12);
    for (const dice of [[2, 3], [1, 1], [4, 2]]) {
      applyCommand(a, 'p0', 'roll', {}, dice);
      applyCommand(b, 'p0', 'roll', {}, dice);
      assert.deepEqual(a.board, b.board);
      assert.deepEqual(a.players, b.players);
      assert.equal(a.phase, b.phase);
      if (a.phase === 'decision') { applyCommand(a, 'p0', 'buy'); applyCommand(b, 'p0', 'buy'); }
      if (a.phase === 'bonus') { applyCommand(a, 'p0', 'end'); applyCommand(b, 'p0', 'end'); }
      else break;
    }
  });
}

test('enchère : une offre à 100 % de la trésorerie est acceptée', () => {
  const s = game();
  land(s, 5, [2, 3]); applyCommand(s, 'p0', 'pass');
  applyCommand(s, 'p0', 'auction-bid', { amount: START });
  applyCommand(s, 'p1', 'auction-pass');
  assert.equal(s.players[0].cash, 0);
  assert.equal(s.board[5].owner, 'p0');
});
test('enchère : mise supérieure à la trésorerie refusée', () => {
  const s = game(); land(s, 5, [2, 3]); applyCommand(s, 'p0', 'pass');
  assert.throws(() => applyCommand(s, 'p0', 'auction-bid', { amount: START + 1 }), /Mise insuffisante/);
});
test('enchère : échange ne peut consommer une mise engagée', () => {
  const s = game();
  s.trade = { from: 'p0', to: 'p1', giveCash: 1000, getCash: 0, giveTiles: [], getTiles: [], giveCards: 0, getCards: 0 };
  land(s, 5, [2, 3]); applyCommand(s, 'p0', 'pass');
  applyCommand(s, 'p0', 'auction-bid', { amount: 1000 });
  applyCommand(s, 'p1', 'trade-accept');
  assert.equal(s.trade, null);
  assert.equal(s.players[0].cash, START);
  applyCommand(s, 'p1', 'auction-pass');
  assert.equal(s.players[0].cash, START - 1000);
});
test('troisième échec au Commissariat : dette puis mouvement après règlement', () => {
  const s = game();
  s.players[0].pos = 10; s.players[0].jailed = 1; s.players[0].jailAttempts = 2; s.players[0].cash = ECONOMY.bail - 50;
  s.board[3].owner = 'p0';
  applyCommand(s, 'p0', 'roll', {}, [1, 2]);
  assert.equal(s.phase, 'debt');
  assert.equal(s.players[0].pos, 10);
  applyCommand(s, 'p0', 'debt-mortgage', { tile: 3 });
  applyCommand(s, 'p0', 'debt-settle');
  assert.equal(s.players[0].pos, 13);
  assert.equal(s.players[0].cash, 0);
  assert.equal(s.phase, 'decision');
});
test('double de sortie du Commissariat : déplacement sans relance supplémentaire', () => {
  const s = game();
  s.players[0].pos = 10; s.players[0].jailed = 1;
  applyCommand(s, 'p0', 'roll', {}, [1, 1]);
  assert.equal(s.players[0].pos, 12);
  assert.equal(s.phase, 'decision');
  applyCommand(s, 'p0', 'buy');
  assert.equal(s.phase, 'end');
  assert.equal(s.lastDouble, false);
});
test('vente d’un titre déjà hypothéqué : pas de deuxième avance', () => {
  const s = game();
  s.board[1].owner = 'p0'; s.board[1].mortgage = true;
  s.players[0].cash = 0; s.phase = 'debt';
  s.pendingDebt = { debtor: 'p0', creditor: 'bank', amount: 100, resumeTurn: 0, resumePhase: 'end' };
  applyCommand(s, 'p0', 'debt-sell', { tile: 1 });
  assert.equal(s.players[0].cash, 0);
  assert.equal(s.board[1].owner, null);
});
test('carte multi-joueurs : les transferts reprennent après une dette', () => {
  const s = game(4);
  s.cityDeck.unshift(['Test solidarité', 'payeach:25']);
  s.players[1].cash = 0; s.board[1].owner = 'p1';
  land(s, 2);
  assert.equal(s.phase, 'debt');
  applyCommand(s, 'p1', 'debt-mortgage', { tile: 1 });
  applyCommand(s, 'p1', 'debt-settle');
  assert.equal(s.players[0].cash, START + 75);
  assert.equal(s.players[2].cash, START - 25);
  assert.equal(s.players[3].cash, START - 25);
  assert.equal(s.pendingCard, null);
});
test('carte multi-joueurs : la faillite d’un débiteur ne prive pas les autres transferts', () => {
  const s = game(4);
  s.cityDeck.unshift(['Test solidarité', 'payeach:25']);
  s.players[1].cash = 0;
  land(s, 2);
  assert.equal(s.phase, 'debt');
  applyCommand(s, 'p1', 'debt-bankrupt');
  assert.equal(s.players[1].bankrupt, true);
  assert.equal(s.players[0].cash, START + 50);
  assert.equal(s.players[2].cash, START - 25);
  assert.equal(s.players[3].cash, START - 25);
  assert.equal(s.pendingCard, null);
});
test('cotisation à plusieurs joueurs : reprend après hypothèque et règlement', () => {
  const s = game(4);
  s.cityDeck.unshift(['Test cotisation', 'collect:10']);
  s.players[0].cash = 0; s.board[3].owner = 'p0';
  land(s, 2);
  assert.equal(s.pendingDebt.creditor, 'p1');
  applyCommand(s, 'p0', 'debt-mortgage', { tile: 3 });
  applyCommand(s, 'p0', 'debt-settle');
  assert.equal(s.players[0].cash, 20);
  assert.deepEqual(s.players.slice(1).map(p => p.cash), [START + 10, START + 10, START + 10]);
  assert.equal(s.pendingCard, null);
});
test('échange vide et titre en double : rejetés', () => {
  const s = game(); s.board[1].owner = 'p0';
  assert.throws(() => applyCommand(s, 'p0', 'trade-propose', { target: 'p1' }), /vide/);
  assert.throws(() => applyCommand(s, 'p0', 'trade-propose', { target: 'p1', giveTiles: [1, 1] }), /invalide/);
});
test('construction : dernier logement, puis stock épuisé', () => {
  const s = game(); s.board[1].owner = 'p0'; s.board[3].owner = 'p0'; s.bank.houses = 1;
  applyCommand(s, 'p0', 'build', { tile: 1 });
  assert.equal(s.bank.houses, 0);
  assert.throws(() => applyCommand(s, 'p0', 'build', { tile: 3 }), /plus de maisons/);
});
test('construction : appartement impossible sans stock', () => {
  const s = game(); s.board[1].owner = 'p0'; s.board[3].owner = 'p0'; s.board[1].level = 3; s.board[3].level = 3; s.bank.apartments = 0;
  assert.throws(() => applyCommand(s, 'p0', 'build', { tile: 1 }), /plus d’appartements/);
});
test('construction : niveau égal obligatoire', () => {
  const s = game(); s.board[1].owner = 'p0'; s.board[3].owner = 'p0'; s.board[1].level = 1;
  assert.throws(() => applyCommand(s, 'p0', 'build', { tile: 1 }), /niveau égal/);
});

for (const count of [2, 4, 6]) {
  for (const seed of Array.from({ length: 20 }, (_, i) => i)) {
    test(`partie complète ${count} joueurs · graine ${seed} : invariants, fin et points`, () => {
      const a = simulate(count, seed), b = simulate(count, seed);
      assert.deepEqual(a, b);
      assert.equal(a.scores.length, count);
      assert.equal(a.points.length, count);
      assert.ok(a.moves > count);
      assert.ok(a.owned <= 28);
    });
  }
}

for (const count of [2, 4, 6]) {
  test(`initiative aléatoire ${count} joueurs : même graine, même premier joueur`, () => {
    for (const seed of [0, 1, 42, 1337]) {
      const a = createGame(makePlayers(count), 60, { seed, randomStart: true });
      const b = createGame(makePlayers(count), 60, { seed, randomStart: true });
      assert.equal(a.firstTurn, b.firstTurn);
      assert.ok(a.firstTurn >= 0 && a.firstTurn < count);
      assert.equal(a.turn, a.firstTurn);
      assert.deepEqual(a.eventDeck, b.eventDeck);
    }
  });
}

test('faillite avec appartement rend un appartement, sans créer de maisons', () => {
  const s = game();
  s.board[1].owner = 'p0'; s.board[1].level = 4; s.bank.apartments = 11;
  s.players[0].cash = 0; s.phase = 'debt';
  s.pendingDebt = { debtor: 'p0', creditor: 'bank', amount: 100, resumeTurn: 0, resumePhase: 'end' };
  applyCommand(s, 'p0', 'debt-bankrupt');
  assert.equal(s.bank.houses, 32);
  assert.equal(s.bank.apartments, 12);
  assert.equal(s.board[1].level, 0);
});

test('expiration : refusée avant 90 secondes', () => {
  const s = game();
  assert.throws(() => applyCommand(s, 'p0', 'timeout'), /pas encore écoulé/);
});

test('expiration : achat non choisi part aux enchères', () => {
  const s = game(); s.phase = 'decision'; s.pending = { type: 'buy', tile: 1 };
  s.turnStartedAt = Date.now() - 91000;
  applyCommand(s, 'p1', 'timeout');
  assert.equal(s.phase, 'auction');
  assert.equal(s.auction.tile, 1);
});

test('fin au temps : départage les patrimoines égaux par l’argent', () => {
  const s = game();
  s.board[1].owner = 'p0'; s.players[0].cash = 1420;
  s.players[1].cash = 1500;
  s.phase = 'end'; s.startedAt = Date.now() - 61 * 60000;
  applyCommand(s, 'p0', 'end');
  assert.equal(s.results[0].id, 'p1');
  assert.equal(s.results[0].score, 1500);
});
