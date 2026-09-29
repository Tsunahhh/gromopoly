import assert from 'node:assert/strict';
import { applyCommand, createGame, ECONOMY, auctionNextBid, debtLimit } from '../src/engine.js';

function random(seed) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
}
// Réserves de sécurité des joueurs simulés (proches d'un joueur humain qui aime acheter).
export const BOT = { buyReserve: 100, buildReserve: 200 };
const dice = rng => [1 + Math.floor(rng() * 6), 1 + Math.floor(rng() * 6)];
const own = (s, id) => s.board.map((tile, index) => ({ ...tile, index })).filter(tile => tile.owner === id);

function checkInvariants(s) {
  assert.ok(s.bank.houses >= 0 && s.bank.houses <= 32);
  assert.ok(s.bank.apartments >= 0 && s.bank.apartments <= 12);
  assert.equal(s.bank.houses + s.board.reduce((sum, tile) => sum + (tile.level === 4 ? 0 : tile.level), 0), 32);
  assert.equal(s.bank.apartments + s.board.filter(tile => tile.level === 4).length, 12);
  for (const p of s.players) assert.ok(Number.isFinite(p.cash) && p.cash >= -debtLimit(s), `${p.name}: solde sous le découvert autorisé`);
  for (const tile of s.board) {
    assert.ok(Number.isInteger(tile.level) && tile.level >= 0 && tile.level <= 4);
    if (tile.owner) assert.ok(s.players.some(p => p.id === tile.owner));
    if (tile.level) assert.ok(tile.owner && !tile.mortgage);
  }
}

function buildOnce(s, id) {
  const p = s.players.find(candidate => candidate.id === id);
  const options = own(s, id).filter(tile => tile.build && p.cash >= tile.build + BOT.buildReserve && s.board.filter(other => other.group === tile.group).every(other => other.owner === id && !other.mortgage) && tile.level < 4);
  options.sort((a, b) => a.build - b.build || a.index - b.index);
  for (const tile of options) {
    try { applyCommand(s, id, 'build', { tile: tile.index }); return true; }
    catch { /* The bank may be short of houses or this street may be ahead of its group. */ }
  }
  return false;
}

function consolidateOnce(s, id) {
  const p = s.players.find(candidate => candidate.id === id);
  const colorGroups = [...new Set(s.board.filter(tile => tile.build).map(tile => tile.group))];
  for (const name of colorGroups) {
    const titles = s.board.map((tile, index) => ({ ...tile, index })).filter(tile => tile.group === name);
    const mine = titles.filter(tile => tile.owner === id);
    const missing = titles.filter(tile => tile.owner && tile.owner !== id && !tile.level && !tile.mortgage);
    if (mine.length !== titles.length - 1 || missing.length !== 1) continue;
    const tile = missing[0], price = Math.ceil(tile.price * 1.25 / 10) * 10;
    if (p.cash < price + tile.build + 200) continue;
    applyCommand(s, id, 'trade-propose', { target: tile.owner, giveCash: price, getTiles: [tile.index] });
    applyCommand(s, tile.owner, 'trade-accept');
    return true;
  }
  return false;
}

function handleDebt(s) {
  const debt = s.pendingDebt, id = debt.debtor, p = s.players.find(candidate => candidate.id === id);
  if (p.cash - debt.amount >= -debtLimit(s)) return applyCommand(s, id, 'debt-settle');
  const titles = own(s, id);
  const built = titles.filter(tile => tile.level).sort((a, b) => b.level - a.level);
  for (const tile of built) {
    try { return applyCommand(s, id, 'debt-sell', { tile: tile.index }); } catch { /* Try another asset. */ }
  }
  const mortgage = titles.find(tile => !tile.mortgage && s.board.filter(other => other.group === tile.group).every(other => other.level === 0));
  if (mortgage) return applyCommand(s, id, 'debt-mortgage', { tile: mortgage.index });
  const sale = titles.find(tile => !tile.level);
  if (sale) return applyCommand(s, id, 'debt-sell', { tile: sale.index });
  return applyCommand(s, id, 'debt-bankrupt');
}

export function simulate(count, seed, maxRounds = count === 2 ? 24 : count === 4 ? 12 : 8) {
  const rng = random(seed * 92821 + count);
  const s = createGame(Array.from({ length: count }, (_, i) => ({ id: `p${i}`, name: `Joueur ${i + 1}` })), 60, { seed, randomStart: true });
  let moves = 0, purchases = 0, buildings = 0, trades = 0, steps = 0;
  const minCash = Object.fromEntries(s.players.map(p => [p.id, p.cash]));
  while (s.status === 'playing' && steps++ < 10000) {
    const phase = s.phase;
    if (phase === 'debt') handleDebt(s);
    else if (phase === 'roll') {
      const id = s.players[s.turn].id, p = s.players[s.turn];
      // Comme un joueur humain : sortir tout de suite du Commissariat si la caution laisse une réserve.
      if (p.jailed && p.cash >= ECONOMY.bail + 300) applyCommand(s, id, 'bail');
      applyCommand(s, id, 'roll', {}, dice(rng)); moves++;
    } else if (phase === 'decision') {
      const id = s.players[s.turn].id, p = s.players[s.turn], tile = s.board[s.pending.tile];
      if (p.cash >= tile.price + BOT.buyReserve) { applyCommand(s, id, 'buy'); purchases++; }
      else applyCommand(s, id, 'pass');
    } else if (phase === 'auction') {
      const id = s.auctionActor, p = s.players.find(candidate => candidate.id === id), tile = s.board[s.auction.tile];
      const bid = auctionNextBid(s);
      if (bid <= Math.floor(tile.price * .95) && p.cash >= bid + BOT.buyReserve) applyCommand(s, id, 'auction-bid', { amount: bid });
      else applyCommand(s, id, 'auction-pass');
    } else if (phase === 'bonus') applyCommand(s, s.players[s.turn].id, 'end');
    else if (phase === 'end') {
      const id = s.players[s.turn].id;
      if (consolidateOnce(s, id)) trades++;
      if (buildOnce(s, id)) buildings++;
      if (s.round >= maxRounds - 1 && s.turn === (s.firstTurn + count - 1) % count) s.startedAt = Date.now() - 61 * 60000;
      applyCommand(s, id, 'end');
    } else throw Error(`Phase inconnue: ${phase}`);
    checkInvariants(s);
    for (const p of s.players) if (!p.bankrupt) minCash[p.id] = Math.min(minCash[p.id], p.cash);
  }
  assert.ok(steps < 10000, `Simulation bloquée: ${count} joueurs, graine ${seed}`);
  assert.equal(s.status, 'finished');
  return {
    count, seed, winner: Number(s.results[0].id.slice(1)), rounds: s.round, moves, purchases, buildings, trades,
    bankrupt: s.players.filter(p => p.bankrupt).length,
    scores: s.results.map(r => r.score),
    owned: s.board.filter(tile => tile.owner).length,
    points: s.results.map(r => r.points),
    economy: economy(s, minCash)
  };
}

// Flux d'argent reconstitués depuis le journal de la partie.
function economy(s, minCash) {
  const sum = re => s.log.reduce((total, { text }) => { const m = text.match(re); return total + (m ? Number(m[1]) : 0); }, 0);
  const count = re => s.log.filter(({ text }) => re.test(text)).length;
  const alive = s.players.filter(p => !p.bankrupt);
  return {
    finalCash: alive.map(p => p.cash),
    minCash: alive.map(p => minCash[p.id]),
    goIncome: sum(/passe par le Départ et reçoit (\d+) ¤/),
    rentBetweenPlayers: sum(/paie (\d+) ¤ à .+ · loyer/),
    playerTransfers: sum(/paie (\d+) ¤ à /),
    bankPayments: sum(/paie (\d+) ¤ ·/),
    bail: sum(/paie (\d+) ¤ · caution/),
    jailed: count(/envoyé au Commissariat|trois doubles/),
    bailPaidRatio: count(/paie \d+ ¤ · caution/) / Math.max(1, count(/envoyé au Commissariat|trois doubles/))
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll('\\', '/'))) {
  const seeds = Number(process.argv[2] || 60);
  for (const count of [2, 4, 6]) {
    const runs = Array.from({ length: seeds }, (_, seed) => simulate(count, seed));
    const wins = Array.from({ length: count }, (_, seat) => runs.filter(run => run.winner === seat).length);
    console.log(JSON.stringify({ players: count, games: seeds, winnerBySeat: wins, medianRounds: median(runs.map(run => run.rounds)), medianMoves: median(runs.map(run => run.moves)), medianPurchases: median(runs.map(run => run.purchases)), medianTrades: median(runs.map(run => run.trades)), medianBuilds: median(runs.map(run => run.buildings)), medianBankrupt: median(runs.map(run => run.bankrupt)), medianTitlesOwned: median(runs.map(run => run.owned)) }));
    const eco = key => median(runs.map(run => run.economy[key]));
    const flat = key => median(runs.flatMap(run => run.economy[key]));
    console.log('  économie', JSON.stringify({ finalCashMedian: flat('finalCash'), minCashMedian: flat('minCash'), goIncome: eco('goIncome'), rentBetweenPlayers: eco('rentBetweenPlayers'), playerTransfers: eco('playerTransfers'), bankPayments: eco('bankPayments'), bail: eco('bail'), jailed: eco('jailed'), bankruptGames: runs.filter(run => run.bankrupt).length }));
  }
}
