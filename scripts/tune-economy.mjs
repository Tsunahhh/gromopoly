// Compare plusieurs réglages économiques sur des parties simulées.
// Usage : node scripts/tune-economy.mjs [parties par format]
import { ECONOMY, RENT_MULTIPLIERS } from '../src/engine.js';
import { BOARD, CARDS } from '../src/board.js';
import { simulate } from './balance.mjs';

const original = { economy: structuredClone(ECONOMY), multipliers: [...RENT_MULTIPLIERS], board: structuredClone(BOARD), cards: structuredClone(CARDS) };
const median = values => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)]; };

function apply(config) {
  Object.assign(ECONOMY, structuredClone(original.economy), config.economy || {});
  RENT_MULTIPLIERS.splice(0, RENT_MULTIPLIERS.length, ...(config.multipliers || original.multipliers));
  BOARD.forEach((tile, i) => Object.assign(tile, original.board[i]));
  if (config.rentFactor) BOARD.forEach(tile => { if (tile.rent) tile.rent = Math.round(tile.rent * config.rentFactor); });
  if (config.taxes) BOARD.forEach(tile => { if (tile.type === 'tax' && config.taxes[tile.name] != null) tile.amount = config.taxes[tile.name]; });
  for (const deck of ['event', 'city']) CARDS[deck].splice(0, CARDS[deck].length, ...structuredClone((config.cards || original.cards)[deck]));
}

export function measure(config, seeds) {
  apply(config);
  const rows = [];
  for (const count of [2, 4, 6]) {
    const runs = Array.from({ length: seeds }, (_, seed) => simulate(count, seed));
    const eco = key => median(runs.map(run => run.economy[key])), flat = key => median(runs.flatMap(run => run.economy[key]));
    rows.push({
      joueurs: count,
      argentFinal: flat('finalCash'), argentMini: flat('minCash'),
      depart: eco('goIncome'), loyers: eco('rentBetweenPlayers'), caution: eco('bail'),
      faillites: `${Math.round(runs.filter(run => run.bankrupt).length / seeds * 100)} %`,
      constructions: median(runs.map(run => run.buildings)),
      victoiresParPlace: Array.from({ length: count }, (_, seat) => runs.filter(run => run.winner === seat).length).join('/')
    });
  }
  apply({});
  return rows;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll('\\', '/'))) {
  const seeds = Number(process.argv[2] || 200);
  const configs = JSON.parse(process.argv[3] || '{"actuel":{}}');
  for (const [name, config] of Object.entries(configs)) { console.log(`\n== ${name}`); console.table(measure(config, seeds)); }
}
