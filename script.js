const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

let deck = [];
let player = [];
let dealer = [];
let money = 1000;
let bet = 0;
let inRound = false;
let canDouble = false;

const moneyEl = document.getElementById("money");
const betEl = document.getElementById("bet");
const dealerCardsEl = document.getElementById("dealer-cards");
const playerCardsEl = document.getElementById("player-cards");
const dealerSumEl = document.getElementById("dealer-sum");
const playerSumEl = document.getElementById("player-sum");
const statusEl = document.getElementById("status");

const startBtn = document.getElementById("start");
const hitBtn = document.getElementById("hit");
const standBtn = document.getElementById("stand");
const doubleBtn = document.getElementById("double");

// --- Колода ---
function makeDeck() {
  let d = [];
  for (let s of suits) {
    for (let r of ranks) {
      d.push({r, s});
    }
  }
  for (let i = d.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i+1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// --- Подсчёт суммы руки ---
function handValue(hand) {
  let total = 0;
  let aces = 0;
  for (let c of hand) {
    if (c.r === 'A') {
      total += 11; aces++;
    } else if (['J','Q','K'].includes(c.r)) {
      total += 10;
    } else {
      total += parseInt(c.r);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

// --- Рендер ---
function render() {
  moneyEl.textContent = money;
  dealerCardsEl.innerHTML = '';
  playerCardsEl.innerHTML = '';

  if (inRound) {
    // показываем первую карту дилера, вторую прячем
    addCard(dealerCardsEl, dealer[0]);
    let hidden = document.createElement("div");
    hidden.className = "card";
    hidden.textContent = "🂠";
    dealerCardsEl.appendChild(hidden);
    dealerSumEl.textContent = "?";
  } else {
    for (let c of dealer) addCard(dealerCardsEl, c);
    dealerSumEl.textContent = handValue(dealer);
  }

  for (let c of player) addCard(playerCardsEl, c);
  playerSumEl.textContent = handValue(player);
}

function addCard(container, card) {
  let div = document.createElement("div");
  div.className = "card " + card.s;
  div.textContent = card.r + card.s;
  container.appendChild(div);
}

function setControls(state) {
  startBtn.disabled = state !== "start";
  hitBtn.disabled = state !== "play";
  standBtn.disabled = state !== "play";
  doubleBtn.disabled = !(state === "play" && canDouble);
}

// --- Игровая логика ---
function startGame() {
  deck = makeDeck();
  player = [];
  dealer = [];
  bet = parseInt(betEl.value) || 10;
  if (bet > money) bet = money;
  inRound = true;
  canDouble = false;
  statusEl.textContent = `Ставка: ${bet}`;

  player.push(deck.pop());
  dealer.push(deck.pop());
  player.push(deck.pop());
  dealer.push(deck.pop());

  if (player.length === 2) canDouble = true;

  setControls("play");
  render();

  if (handValue(player) === 21) {
    endRound();
  }
}

function hit() {
  player.push(deck.pop());
  canDouble = false;
  render();
  if (handValue(player) > 21) {
    statusEl.textContent = "Перебор! Вы проиграли.";
    money -= bet;
    endRound();
  }
}

function stand() {
  dealerPlay();
  endRound();
}

function double() {
  if (!canDouble) return;
  if (bet * 2 > money) {
    statusEl.textContent = "Недостаточно средств для дабла!";
    return;
  }
  bet *= 2;
  player.push(deck.pop());
  statusEl.textContent = `Ставка удвоена: ${bet}`;
  render();
  dealerPlay();
  endRound();
}

function dealerPlay() {
  while (handValue(dealer) < 17) {
    dealer.push(deck.pop());
  }
}

function endRound() {
  inRound = false;
  setControls("start");
  render();

  let pv = handValue(player);
  let dv = handValue(dealer);
  let msg = "";
  if (pv > 21) {
    msg = "Перебор! Проигрыш.";
    money -= bet;
  } else if (dv > 21) {
    msg = "Дилер перебрал. Вы выиграли!";
    money += bet;
  } else if (pv > dv) {
    msg = `Вы выиграли! ${pv} против ${dv}`;
    money += bet;
  } else if (pv < dv) {
    msg = `Вы проиграли. ${pv} против ${dv}`;
    money -= bet;
  } else {
    msg = `Ничья! ${pv} против ${dv}`;
  }
  statusEl.textContent = msg;
  render();
}

// --- События ---
startBtn.addEventListener("click", startGame);
hitBtn.addEventListener("click", hit);
standBtn.addEventListener("click", stand);
doubleBtn.addEventListener("click", double);

setControls("start");
render();
