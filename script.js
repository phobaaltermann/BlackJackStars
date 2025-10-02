/* Blackjack standalone (inspired by vlackjack)
   - Shoe: 6 decks
   - Reshuffle when 75% of cards used
   - Dealer stands on any 17 (S17)
   - Double: only on initial 2-card hand; doubles bet, gives 1 card and ends player's turn
   - Blackjack payout configurable via BLACKJACK_PAYOUT (default 1.5)
*/

const NUM_DECKS = 6;
const RESHUFFLE_AT_USED_RATIO = 0.75; // reshuffle when 75% of shoe used
const BLACKJACK_PAYOUT = 1.5; // 1.5x payout (3:2). Change if you want different rule

// DOM
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('btn-start');
const startMoneyInput = document.getElementById('start-money');
const startBetInput = document.getElementById('start-bet');

const gameScreen = document.getElementById('game-screen');
const moneyEl = document.getElementById('money');
const betEl = document.getElementById('bet');
const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');
const dealerSumEl = document.getElementById('dealer-sum');
const playerSumEl = document.getElementById('player-sum');
const statusEl = document.getElementById('status');

const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');
const btnDouble = document.getElementById('btn-double');
const btnNew = document.getElementById('btn-new');

const SUITS = ['♠','♥','♦','♣'];
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

let shoe = [];         // array of cards
let usedCount = 0;     // number of cards dealt since last shuffle
let player = [];
let dealer = [];
let inRound = false;
let canDouble = false;
let currentBet = 0;
let money = 1000;

// Utilities
function makeShoe(numDecks=NUM_DECKS) {
  const s = [];
  for (let d=0; d<numDecks; d++){
    for (const suit of SUITS) for (const rank of RANKS) s.push({rank, suit});
  }
  return shuffle(s);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function drawCard() {
  if (!shoe.length) reshuffleShoe();
  usedCount++;
  const card = shoe.pop();
  // if we've used threshold — reshuffle after this round (we just note)
  const total = NUM_DECKS * 52;
  if (usedCount / total >= RESHUFFLE_AT_USED_RATIO) {
    // mark for reshuffle once round ends (we'll reshuffle at endRound to avoid mid-round changes)
    shoe._needReshuffle = true;
  }
  return card;
}

function reshuffleShoe() {
  shoe = makeShoe(NUM_DECKS);
  usedCount = 0;
  shoe._needReshuffle = false;
}

// Hand value (A=11 or 1)
function handValue(hand) {
  let total=0, aces=0;
  for (const c of hand) {
    if (c.rank === 'A') { total += 11; aces++; }
    else if (['K','Q','J'].includes(c.rank)) total += 10;
    else total += parseInt(c.rank, 10);
  }
  while (total > 21 && aces>0) { total -= 10; aces--; }
  return total;
}
function isBlackjack(hand) {
  return hand.length === 2 && handValue(hand) === 21;
}

// UI helpers
function makeCardNode(card) {
  const d = document.createElement('div');
  d.className = 'card ' + ((card.suit==='♥' || card.suit==='♦') ? 'red' : '');
  d.innerHTML = `<span class="corner">${card.rank}${card.suit}</span>`;
  return d;
}

function renderHands(hideDealerHole=true) {
  // dealer
  dealerCardsEl.innerHTML = '';
  if (inRound && hideDealerHole) {
    // show first card, hide second
    if (dealer[0]) dealerCardsEl.appendChild(makeCardNode(dealer[0]));
    const hidden = document.createElement('div');
    hidden.className='card hidden';
    hidden.textContent = '🂠';
    dealerCardsEl.appendChild(hidden);
    dealerSumEl.textContent = '?';
  } else {
    for (const c of dealer) dealerCardsEl.appendChild(makeCardNode(c));
    dealerSumEl.textContent = handValue(dealer);
  }

  // player
  playerCardsEl.innerHTML = '';
  for (const c of player) playerCardsEl.appendChild(makeCardNode(c));
  playerSumEl.textContent = handValue(player);

  moneyEl.textContent = money;
  betEl.value = currentBet;
}

function setControls(state) {
  // state: 'start', 'play', 'roundOver'
  if (state === 'start') {
    btnHit.disabled = true;
    btnStand.disabled = true;
    btnDouble.disabled = true;
    btnNew.style.display = 'none';
  } else if (state === 'play') {
    btnHit.disabled = false;
    btnStand.disabled = false;
    btnDouble.disabled = !canDouble;
    btnNew.style.display = 'none';
  } else {
    btnHit.disabled = true;
    btnStand.disabled = true;
    btnDouble.disabled = true;
    btnNew.style.display = 'inline-block';
  }
}

// Game flow
function startRound(initialBet) {
  // prepare shoe if empty
  if (!shoe.length) reshuffleShoe();

  currentBet = Math.max(1, Math.floor(initialBet||1));
  if (currentBet > money) currentBet = money;

  player = [];
  dealer = [];
  inRound = true;
  canDouble = true;

  // deal
  player.push(drawCard());
  dealer.push(drawCard());
  player.push(drawCard());
  dealer.push(drawCard());

  statusEl.textContent = `Игра началась — ставка ${currentBet}.`;
  setControls('play');
  renderHands(true);

  // immediate blackjack checks
  if (isBlackjack(player) || isBlackjack(dealer)) {
    // show hands and finish
    setTimeout(() => finishRound(), 350);
  }
}

function playerHit() {
  if (!inRound) return;
  player.push(drawCard());
  canDouble = false; // after hit, double not allowed
  renderHands(true);
  const pv = handValue(player);
  if (pv > 21) {
    statusEl.textContent = `Перебор ${pv} — вы проиграли.`;
    // apply loss and end round
    money -= currentBet;
    endRoundCleanup();
  } else {
    statusEl.textContent = `Вы взяли карту. Текущая сумма: ${pv}.`;
  }
}

function playerDouble() {
  if (!inRound) return;
  if (!canDouble || player.length !== 2) {
    statusEl.textContent = 'Дабл недоступен — можно только на первых двух картах.';
    return;
  }
  if (currentBet * 2 > money) {
    statusEl.textContent = 'Недостаточно средств для удвоения.';
    return;
  }
  currentBet *= 2;
  // give exactly one card and stand
  player.push(drawCard());
  renderHands(true);
  statusEl.textContent = `Вы удвоили ставку до ${currentBet}. Дилер ходит...`;
  // if player busted immediately, will be handled in finishRound
  setTimeout(() => finishRound(), 350);
}

function playerStand() {
  if (!inRound) return;
  statusEl.textContent = 'Вы встали. Ход дилера...';
  setControls('play'); // keep disabled toggles until dealer plays
  setTimeout(() => finishRound(), 350);
}

function dealerPlay() {
  // Dealer stands on ANY 17 (S17)
  while (handValue(dealer) < 17) {
    dealer.push(drawCard());
  }
}

function finishRound() {
  // Dealer plays (unless player already busted)
  if (handValue(player) <= 21) dealerPlay();
  renderHands(false);

  const pv = handValue(player);
  const dv = handValue(dealer);
  let msg = '';
  let payout = 0;

  if (pv > 21) {
    msg = `Вы перебрали (${pv}). Проигрыш.`;
    money -= currentBet;
  } else if (isBlackjack(player) && !isBlackjack(dealer)) {
    // player blackjack (and dealer not) — payout
    payout = Math.floor(currentBet * BLACKJACK_PAYOUT);
    msg = `Blackjack! Вы выиграли ${payout} (payout ${BLACKJACK_PAYOUT}x).`;
    money += payout;
  } else if (isBlackjack(player) && isBlackjack(dealer)) {
    msg = `Оба — Blackjack. Ничья (push).`;
    // no money change
  } else if (dv > 21) {
    msg = `Дилер перебрал (${dv}). Вы выиграли ${currentBet}.`;
    money += currentBet;
  } else if (pv > dv) {
    msg = `Вы ${pv} vs ${dv} — победа! Вы выиграли ${currentBet}.`;
    money += currentBet;
  } else if (pv < dv) {
    msg = `Вы ${pv} vs ${dv} — проигрыш.`;
    money -= currentBet;
  } else {
    msg = `Ничья ${pv} vs ${dv}. Ставка возвращена.`;
  }

  statusEl.textContent = msg + ` Баланс: ${money}.`;
  endRoundCleanup();
}

function endRoundCleanup() {
  inRound = false;
  setControls('roundOver');
  renderHands(false);

  // if shoe marked for reshuffle after threshold, do it now
  if (shoe._needReshuffle) {
    reshuffleShoe();
    statusEl.textContent += ' (Колода перетасована)';
  }

  // if money <= 0, reset money to default and show message
  if (money <= 0) {
    statusEl.textContent += ' Баланс опустился до 0 — пополнен до 1000.';
    money = 1000;
  }
}

// Event wiring
startBtn.addEventListener('click', () => {
  // initialize money and bet from start screen
  money = parseInt(startMoneyInput.textContent,10) || 1000;
  const startBet = parseInt(startBetInput.value,10) || 10;
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  moneyEl.textContent = money;
  betEl.value = startBet;
  statusEl.textContent = 'Готово. Нажми Начать раунд.';
  setControls('start');
  // auto-prepare shoe
  reshuffleShoe();
});

btnHit.addEventListener('click', () => {
  playerHit();
});

btnStand.addEventListener('click', () => {
  playerStand();
});

btnDouble.addEventListener('click', () => {
  playerDouble();
});

btnNew.addEventListener('click', () => {
  // start new round from screen; keep balance
  const bet = parseInt(betEl.value,10) || 1;
  startRound(bet);
});

// allow pressing Enter on bet to start a round quickly
betEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !inRound) {
    startRound(parseInt(betEl.value,10) || 1);
  }
});

// double-click space for quick hit
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && inRound) {
    e.preventDefault();
    playerHit();
  }
});

// helper to start the first round from UI quickly (start button in start-screen)
document.addEventListener('DOMContentLoaded', () => {
  // nothing to do; UI waits for user to press Start
});
