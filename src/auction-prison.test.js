import test from 'node:test';
import assert from 'node:assert/strict';
import { BOARD } from './board.js';
import { createGame, applyCommand, auctionNextBid } from './engine.js';
import { gameMarkup, rulesMarkup } from './game-view.js';

const game = (count = 3) => createGame(Array.from({length:count}, (_, i) => ({id:`p${i}`,name:`Joueur ${i}`})), 60, {seed:42});
function auction(s, tile = 5) {
  s.phase = 'decision'; s.pending = {type:'buy',tile};
  applyCommand(s, s.players[s.turn].id, 'pass');
}
const bid = s => applyCommand(s, s.auctionActor, 'auction-bid', {amount:auctionNextBid(s)});

for (const [index, tile] of BOARD.entries()) {
  if (tile.type !== 'street') continue;
  test(`${tile.name} : départ 80 %, sous-enchère refusée sans mutation`, () => {
    const s = game(); auction(s,index);
    const minimum = Math.ceil(tile.price * 80 / 100), before = structuredClone(s);
    assert.equal(auctionNextBid(s),minimum);
    assert.throws(()=>applyCommand(s,'p0','auction-bid',{amount:minimum-1}),/Mise/);
    assert.deepEqual(s,before);
    bid(s); assert.equal(s.auction.highBid,minimum);
  });
  test(`${tile.name} : plusieurs paliers +5 %, arrondis et rotation`, () => {
    const s = game(); auction(s,index);
    let amount = Math.ceil(tile.price * 80 / 100);
    for (let i=0;i<7;i++) {
      assert.equal(s.auctionActor,`p${i%3}`);
      assert.equal(auctionNextBid(s),amount);
      bid(s); assert.equal(s.auction.highBid,amount);
      amount = Math.ceil(amount*105/100);
    }
  });
  test(`${tile.name} : aucun joueur solvable, aucune vente gratuite`, () => {
    const s = game(), cash = Math.ceil(tile.price*80/100)-1;
    s.players.forEach(p=>p.cash=cash); auction(s,index);
    assert.equal(s.phase,'end'); assert.equal(s.auction,null);
    assert.equal(s.board[index].owner,null);
    assert.ok(s.players.every(p=>p.cash===cash));
  });
}

test('enchères : départ au joueur courant, rotation à six, exclusion des faillites', () => {
  const s=game(6); s.turn=3; s.players[4].bankrupt=true; auction(s);
  for(const id of ['p3','p5','p0','p1','p2','p3']) {assert.equal(s.auctionActor,id);bid(s);}
});
test('enchères : fonds exacts, passage forcé et gagnant débité une seule fois', () => {
  const s=game(); s.players[0].cash=159;s.players[1].cash=160;s.players[2].cash=167;
  auction(s);assert.equal(s.auctionActor,'p1');bid(s);
  assert.equal(s.phase,'end');assert.equal(s.board[5].owner,'p1');
  assert.deepEqual(s.players.map(p=>p.cash),[159,0,167]);
  assert.throws(()=>applyCommand(s,'p1','auction-bid',{amount:160}));
});
test('enchères : passer retire définitivement, le leader peut être dépassé', () => {
  const s=game(4);auction(s);bid(s);applyCommand(s,'p1','auction-pass');bid(s);bid(s);
  assert.equal(s.auctionActor,'p0');bid(s);
  assert.equal(s.auctionActor,'p2');applyCommand(s,'p2','auction-pass');applyCommand(s,'p3','auction-pass');
  assert.equal(s.board[5].owner,'p0');assert.equal(s.players[0].cash,1200-186);
});
test('enchères : aucun acheteur volontaire conserve le terrain libre et la relance', () => {
  const s=game();s.lastDouble=true;auction(s);
  for(const id of ['p0','p1','p2'])applyCommand(s,id,'auction-pass');
  assert.equal(s.phase,'bonus');assert.equal(s.board[5].owner,null);
});
test('enchères : action hors tour et montants invalides refusés sans mutation', () => {
  const s=game();auction(s);const before=structuredClone(s);
  assert.throws(()=>applyCommand(s,'p1','auction-bid',{amount:160}),/tour/);
  for(const amount of [0,-1,159,161,160.9,NaN,Infinity,'abc',null]) {
    assert.throws(()=>applyCommand(s,'p0','auction-bid',{amount}),/Mise/);assert.deepEqual(s,before);
  }
});
test('enchères : temps renouvelé après chaque action et expiration fait passer', () => {
  const s=game();auction(s);s.turnStartedAt=Date.now()-100000;
  applyCommand(s,'p0','timeout');assert.equal(s.auctionActor,'p1');
  assert.ok(Date.now()-s.turnStartedAt<2000);
  assert.throws(()=>applyCommand(s,'p1','timeout'),/pas encore/);
});

for(const cash of [-500,0,99,100,1200]) {
  test(`prison : trois tours complets, sortie gratuite avec solde ${cash}`, () => {
    const s=game(2),p=s.players[0];p.pos=10;p.jailed=1;p.cash=cash;
    for(let attempt=1;attempt<=3;attempt++) {
      applyCommand(s,'p0','roll',{},[1,2]);
      assert.equal(p.cash,cash);assert.equal(s.pendingDebt,undefined);
      if(attempt<3) {
        assert.equal(p.pos,10);assert.equal(p.jailed,1);assert.equal(p.jailAttempts,attempt);
        assert.throws(()=>applyCommand(s,'p0','roll',{},[1,2]));
        applyCommand(s,'p0','end');s.players[1].pos=17;
        applyCommand(s,'p1','roll',{},[1,2]);applyCommand(s,'p1','end');
      }
    }
    assert.equal(p.pos,13);assert.equal(p.jailed,0);assert.equal(p.jailAttempts,0);
    assert.equal(s.phase,'decision');assert.equal(s.rollCount,5);
    assert.ok(!s.log.some(x=>x.text.includes('paie 100')));
  });
}
for(let attempt=0;attempt<3;attempt++) for(let die=1;die<=6;die++) {
  test(`prison : double ${die} au tour ${attempt+1}, sans caution ni relance`, () => {
    const s=game(),p=s.players[0];p.pos=10;p.jailed=1;p.jailAttempts=attempt;p.cash=0;
    // Isolate release/movement from subsequent cards and property effects.
    s.board[10+die*2]={name:'Repos test',type:'rest'};
    applyCommand(s,'p0','roll',{},[die,die]);
    assert.equal(p.cash,0);assert.equal(p.jailed,0);assert.equal(p.jailAttempts,0);
    assert.equal(p.pos,10+die*2);assert.equal(s.phase,'end');assert.equal(s.lastDouble,false);
  });
}
test('prison : caution volontaire de 100 une seule fois avant déplacement', () => {
  const s=game(),p=s.players[0];p.pos=10;p.jailed=1;p.cash=100;p.jailAttempts=2;
  applyCommand(s,'p0','bail');assert.equal(p.cash,0);assert.equal(p.jailed,0);
  assert.equal(p.jailAttempts,0);assert.equal(p.pos,10);assert.equal(s.phase,'roll');
  assert.throws(()=>applyCommand(s,'p0','bail'));
  applyCommand(s,'p0','roll',{},[1,2]);assert.equal(p.pos,13);assert.equal(p.cash,0);
});
test('prison : caution impossible à 99, carte Libération reste utilisable', () => {
  const s=game(),p=s.players[0];p.pos=10;p.jailed=1;p.cash=99;p.releaseCards=1;
  assert.throws(()=>applyCommand(s,'p0','bail'),/Fonds/);
  applyCommand(s,'p0','release');assert.equal(p.cash,99);assert.equal(p.releaseCards,0);assert.equal(p.jailed,0);
});
test('prison : sortie gratuite conserve le loyer normal de la case arrivée', () => {
  const s=game(),p=s.players[0];p.pos=10;p.jailed=1;p.jailAttempts=2;p.cash=500;s.board[13].owner='p1';
  applyCommand(s,'p0','roll',{},[1,2]);assert.equal(p.cash,500-s.board[13].rent);
  assert.equal(s.players[1].cash,1200+s.board[13].rent);
});
test('prison : expiration du troisième essai libère gratuitement', () => {
  const s=game(),p=s.players[0];p.pos=10;p.jailed=1;p.jailAttempts=2;p.cash=0;
  s.board[13]={name:'Repos test',type:'rest'};s.turnStartedAt=Date.now()-100000;
  applyCommand(s,'p0','timeout',{},[1,2]);assert.equal(p.jailed,0);assert.equal(p.cash,0);assert.equal(p.pos,13);
});
test('interface : mise fixe correcte et règle de sortie gratuite visibles', () => {
  const s=game();auction(s);
  const render=()=>gameMarkup({state:s,me:s.players[0],roomCode:'TEST',clock:'60:00',anim:false});
  assert.match(render(),/Miser 160 ¤/);assert.doesNotMatch(render(),/bid-amount/);
  s.phase='roll';s.players[0].jailed=1;
  assert.match(render(),/Après trois échecs, tu sors gratuitement/);
  assert.match(rulesMarkup,/départ à 80 %/);
});
