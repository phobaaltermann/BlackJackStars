// Взято и адаптировано из lucasdcampos/blackjack с доработками

const SUITS = ["H","D","C","S"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

let deck = [];
let playerHand = [];
let dealerHand = [];

let balance = 0;
let bet = 50;
let inGame = false;

function shuffleDeck() {
  deck = [];
  for (let s of SUITS) {
    for (let v of VALUES) {
      deck.push(v + s);
    }
  }
  // Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function cardValue(card) {
  let v = card.slice(0, -1);
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
    // показываем первую карту дилера, остальные скрыты
    if (dealerHand.length > 0) {
      let img = document.createElement("img");
      img.src = `cards/${dealerHand[0]}.png`;
      dh.appendChild(img);
      let img2 = document.createElement("img");
      img2.src = `cards/back.png`;
      dh.appendChild(img2);
    }
  }
  document.getElementById("player-score").innerText = "Очки: " + handScore(playerHand);
  if (showDealer) {
    document.getElementById("dealer-score").innerText = "Очки: " + handScore(dealerHand);
  } else {
    document.getElementById("dealer-score").innerText = "";
  }
}

function showMessage(msg) {
  document.getElementById("message").innerText = msg;
}

function newDeal() {
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
  shuffleDeck();
  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];
  renderHands(false);
  showMessage("Игра — действуй!");
  updateInfo();
}

function hit() {
  if (!inGame) {
    showMessage("Начни игру");
    return;
  }
  playerHand.push(deck.pop());
  renderHands(false);
  let ps = handScore(playerHand);
  if (ps > 21) {
    endRound("Перебор! Ты проиграл.");
  }
}

function stand() {
  if (!inGame) {
    showMessage("Начни игру");
    return;
  }
  // дилер тянет до 17
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
    showMessage("Недостаточно для Double");
    return;
  }
  balance -= bet;
  bet *= 2;
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
    endRound("😢 Дилер выиграл");
  } else {
    balance += bet;
    endRound("Ничья 🤝");
  }
}

function endRound(message) {
  inGame = false;
  showMessage(message);
  updateInfo();
}

function updateInfo() {
  document.getElementById("balance").innerText = balance;
  document.getElementById("bet").innerText = bet;
}

// инициализация
window.onload = function() {
  // баланс может загрузиться от backend
  balance = 1000;
  updateInfo();
  showMessage("Нажми «Новая игра»");
};