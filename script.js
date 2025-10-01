// взято и адаптировано от lucasdcampos

const SUITS = ["♠","♥","♦","♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

let deck = [];
let playerHand = [];
let dealerHand = [];

let balance = 0;
let bet = 50;
let inGame = false;

// инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe?.user;
const user_id = user?.id ?? 0;

// Получить баланс от backend (если реализовано)
async function loadBalance() {
  // предположим, есть endpoint /api/user/{user_id}/balance
  try {
    const res = await fetch(`/api/user/${user_id}/balance`);
    const j = await res.json();
    if (j.balance !== undefined) {
      balance = j.balance;
      updateInfo();
    }
  } catch (e) {
    console.error("Ошибка загрузки баланса:", e);
  }
}

function shuffleDeck() {
  deck = [];
  for (let s of SUITS) {
    for (let v of VALUES) {
      deck.push(v + s);
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function cardValue(card) {
  const v = card.slice(0, -1);
  if (["J","Q","K"].includes(v)) return 10;
  if (v === "A") return 11;
  return parseInt(v);
}

function handScore(hand) {
  let sum = 0;
  let aces = 0;
  for (let c of hand) {
    sum += cardValue(c);
    if (c.slice(0, -1) === "A") aces++;
  }
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
  }
  return sum;
}

function renderHands(showDealer = false) {
  const ph = document.getElementById("player-cards");
  const dh = document.getElementById("dealer-cards");
  ph.innerHTML = "";
  dh.innerHTML = "";

  for (let c of playerHand) {
    let img = document.createElement("img");
    img.src = `cards/${c}.png`;
    ph.appendChild(img);
  }
  if (showDealer) {
    for (let c of dealerHand) {
      let img = document.createElement("img");
      img.src = `cards/${c}.png`;
      dh.appendChild(img);
    }
  } else {
    if (dealerHand.length > 0) {
      let img = document.createElement("img");
      img.src = `cards/${dealerHand[0]}.png`;
      dh.appendChild(img);
      let img2 = document.createElement("img");
      img2.src = `cards/back.png`;
      dh.appendChild(img2);
    }
  }
  document.getElementById("player-score").innerText = `Очки: ${handScore(playerHand)}`;
  if (showDealer)
    document.getElementById("dealer-score").innerText = `Очки: ${handScore(dealerHand)}`;
  else
    document.getElementById("dealer-score").innerText = "";
}

function showMessage(msg) {
  document.getElementById("message").innerText = msg;
}

function deal() {
  if (inGame) {
    showMessage("Игра уже идёт");
    return;
  }
  if (balance < bet) {
    showMessage("Недостаточно звёзд");
    return;
  }
  inGame = true;
  balance -= bet;
  updateInfo();
  shuffleDeck();
  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];
  renderHands(false);
  showMessage("Ходи!");
}

function hit() {
  if (!inGame) {
    showMessage("Начни игру");
    return;
  }
  playerHand.push(deck.pop());
  renderHands(false);
  const ps = handScore(playerHand);
  if (ps > 21) {
    endRound("Перебор! Ты проиграл.");
  } else {
    showMessage("Твой ход");
  }
}

function stand() {
  if (!inGame) {
    showMessage("Начни игру");
    return;
  }
  while (handScore(dealerHand) < 17) {
    dealerHand.push(deck.pop());
  }
  renderHands(true);
  decideWinner();
}

function doubleDown() {
  if (!inGame) {
    showMessage("Начни игру");
    return;
  }
  if (balance < bet) {
    showMessage("Недостаточно звёзд");
    return;
  }
  balance -= bet;
  bet *= 2;
  updateInfo();
  playerHand.push(deck.pop());
  renderHands(false);
  stand();
}

function decideWinner() {
  const ps = handScore(playerHand);
  const ds = handScore(dealerHand);
  if (ds > 21 || ps > ds) {
    balance += bet * 2;
    endRound("🎉 Ты выиграл!");
  } else if (ps < ds) {
    endRound("😢 Дилер победил");
  } else {
    balance += bet;
    endRound("🤝 Ничья");
  }
}

function endRound(msg) {
  inGame = false;
  showMessage(msg);
  updateInfo();
}

function changeBet(delta) {
  if (inGame) return;
  bet = Math.max(10, bet + delta);
  document.getElementById("bet").innerText = bet;
}

function updateInfo() {
  document.getElementById("balance").innerText = balance;
  document.getElementById("bet").innerText = bet;
}

// старт
window.onload = () => {
  loadBalance();
  updateInfo();
  showMessage("Нажми «Новая раздача»");
};
