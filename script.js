const NUM_DECKS = 6;
const RESHUFFLE_AT_USED_RATIO = 0.75;
const BLACKJACK_PAYOUT = 1.5;

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

let shoe = [];
let usedCount = 0;
let player = [];
let dealer = [];
let inRound = false;
let canDouble = false;
let currentBet = 0;
let money = 1000;

// === Card helpers ===
function cardFilename(card) {
  let rank = card.rank;
  let suit = '';
  if (card.suit === '♥') suit = 'H';
  if (card.suit === '♦') suit = 'D';
  if (card.suit === '♣') suit = 'C';
  if (card.suit === '♠') suit = 'S';
  return `${rank}${suit}.png`;
}

function makeCardNode(card, hidden=false) {
  const d = document.createElement('div');
  d.className = 'card';
  if (hidden) {
    d.classList.add('hidden');
    d.textContent = '🂠';
    return d;
  }
  const img = document.createElement('img');
  img.src = `assets/cards/${cardFilename(card)}`;
  img.alt = `${card.rank}${card.suit}`;
  d.appendChild(img);
  return d;
}

// === Shoe and shuffle ===
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
  const total = NUM_DECKS * 52;
  if (usedCount / total >= RESHUFFLE_AT_USED_RATIO) {
    shoe._needReshuffle = true;
  }
  return card;
}
function reshuffleShoe() {
  shoe = makeShoe(NUM_DECKS);
  usedCount = 0;
  shoe._needReshuffle = false;
}

// === Hand helpers ===
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

// === Rendering ===
function renderHands(hideDealerHole=true) {
  dealerCardsEl.innerHTML = '';
  if (inRound && hideDealerHole) {
    dealerCardsEl.appendChild(makeCardNode(dealer[0]));
    dealerCardsEl.appendChild(makeCardNode(dealer[1], true));
    dealerSumEl.textContent = '?';
  } else {
    for (const c of dealer) dealerCardsEl.appendChild(makeCardNode(c));
    dealerSumEl.textContent = handValue(dealer);
  }

  playerCardsEl.innerHTML = '';
  for (const c of player) playerCardsEl.appendChild(makeCardNode(c));
  playerSumEl.textContent = handValue(player);

  moneyEl.textContent = money;
  betEl.value = currentBet;
}
function setControls(state) {
  if (state === 'start') {
    btnHit.disabled = true; btnStand.disabled = true; btnDouble.disabled = true; btnNew.style.display = 'none';
  } else if (state === 'play') {
    btnHit.disabled = false; btnStand.disabled = false; btnDouble.disabled = !canDouble; btnNew.style.display = 'none';
  } else {
    btnHit.disabled = true; btnStand.disabled = true; btnDouble.disabled = true; btnNew.style.display = 'inline-block';
  }
}

// === Game flow ===
function startRound(initialBet) {
  if (!shoe.length) reshuffleShoe();
  currentBet = Math.max(1, Math.floor(initialBet||1));
  if (currentBet > money) currentBet = money;

  player = []; dealer = [];
  inRound = true; canDouble = true;

  player.push(drawCard()); dealer.push(drawCard());
  player.push(drawCard()); dealer.push(drawCard());

  statusEl.textContent = `Игра началась — ставка ${currentBet}.`;
  setControls('play');
  renderHands(true);

  if (isBlackjack(player) || isBlackjack(dealer)) {
    setTimeout(() => finishRound(), 350);
  }
}
function playerHit() {
  if (!inRound) return;
  player.push(drawCard());
  canDouble = false;
  renderHands(true);
  const pv = handValue(player);
  if (pv > 21) {
    statusEl.textContent = `Перебор ${pv} — вы проиграли.`;
    money -= currentBet;
    endRoundCleanup();
  }
}
function playerDouble() {
  if (!inRound) return;
  if (!canDouble || player.length !== 2) {
    statusEl.textContent = 'Дабл доступен только на первых двух картах.';
    return;
  }
  if (currentBet * 2 > money) {
    statusEl.textContent = 'Недостаточно средств.';
    return;
  }
  currentBet *= 2;
  player.push(drawCard());
  renderHands(true);
  statusEl.textContent = `Вы удвоили ставку до ${currentBet}.`;
  setTimeout(() => finishRound(), 350);
}
function playerStand() {
  if (!inRound) return;
  statusEl.textContent = 'Вы встали. Ход дилера...';
  setTimeout(() => finishRound(), 350);
}
function dealerPlay() {
  while (handValue(dealer) < 17) dealer.push(drawCard());
}
function finishRound() {
  if (handValue(player) <= 21) dealerPlay();
  renderHands(false);

  const pv = handValue(player), dv = handValue(dealer);
  let msg='', payout=0;
  if (pv > 21) { msg=`Вы перебрали (${pv}).`; money -= currentBet; }
  else if (isBlackjack(player) && !isBlackjack(dealer)) {
    payout = Math.floor(currentBet * BLACKJACK_PAYOUT);
    msg = `Blackjack! +${payout}.`; money += payout;
  } else if (isBlackjack(player) && isBlackjack(dealer)) msg = `Оба Blackjack — ничья.`;
  else if (dv > 21) { msg=`Дилер перебрал (${dv}). +${currentBet}`; money += currentBet; }
  else if (pv > dv) { msg=`Вы ${pv} vs ${dv} — победа! +${currentBet}`; money += currentBet; }
  else if (pv < dv) { msg=`Вы ${pv} vs ${dv} — проигрыш.`; money -= currentBet; }
  else msg=`Ничья ${pv} vs ${dv}.`;

  statusEl.textContent = msg + ` Баланс: ${money}`;
  endRoundCleanup();
}
function endRoundCleanup() {
  inRound = false; setControls('roundOver'); renderHands(false);
  if (shoe._needReshuffle) { reshuffleShoe(); statusEl.textContent += ' Колода перетасована.'; }
  if (money <= 0) { money=1000; statusEl.textContent += ' Баланс сброшен до 1000.'; }
}

// === Events ===
startBtn.addEventListener('click', () => {
  money = parseInt(startMoneyInput.textContent,10) || 1000;
  const startBet = parseInt(startBetInput.value,10) || 10;
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  moneyEl.textContent = money; 
  betEl.value = startBet;
  reshuffleShoe(); 
  setControls('start');

  // ✅ стартуем первую раздачу сразу
  startRound(startBet);
});

btnHit.addEventListener('click', playerHit);
btnStand.addEventListener('click', playerStand);
btnDouble.addEventListener('click', playerDouble);
btnNew.addEventListener('click', () => startRound(parseInt(betEl.value,10)||1));


