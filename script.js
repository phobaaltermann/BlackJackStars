// Простая, но корректная логика BlackJack.

// Игра хранится в объекте `game`
const game = {
  deck: [],
  player: [],
  dealer: [],
  inRound: false,
  canDouble: false,
  doubled: false,
  bet: 10,
  money: 1000
};

const suits = ['♠','♥','♦','♣'];
const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

// --- DOM ---
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const gameArea = document.getElementById('game-area');
const moneyDisplay = document.getElementById('money-display');
const betInput = document.getElementById('bet-input');

const dealerCardsDiv = document.getElementById('dealer-cards');
const playerCardsDiv = document.getElementById('player-cards');
const dealerSumDiv = document.getElementById('dealer-sum');
const playerSumDiv = document.getElementById('player-sum');
const statusDiv = document.getElementById('status');

const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const doubleBtn = document.getElementById('double-btn');
const newBtn = document.getElementById('new-btn');

// --- Deck / cards helpers ---
function createDeck(numDecks = 1) {
  const deck = [];
  for (let d = 0; d < numDecks; d++) {
    for (const s of suits) {
      for (const r of ranks) {
        deck.push({r, s});
      }
    }
  }
  return deck;
}
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}
function draw() {
  if (game.deck.length === 0) {
    game.deck = createDeck(4);
    shuffle(game.deck);
  }
  return game.deck.pop();
}
function cardToText(card) {
  return `${card.r}${card.s}`;
}
function calcValue(cards) {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.r === 'A') { total += 11; aces++; }
    else if (['J','Q','K'].includes(c.r)) total += 10;
    else total += parseInt(c.r, 10);
  }
  while (total > 21 && aces > 0) {
    total -= 10; aces--;
  }
  return total;
}

// --- UI update ---
function updateUI() {
  moneyDisplay.textContent = game.money;
  dealerCardsDiv.innerHTML = '';
  playerCardsDiv.innerHTML = '';

  // Dealer: если раунд всё ещё идет, показываем 1 открытую + 1 скрытую карту
  if (game.inRound) {
    // первая карта открыта
    const first = game.dealer[0];
    dealerCardsDiv.appendChild(makeCardNode(first));
    // вторая карта скрыта
    if (game.dealer.length > 1) {
      const hidden = document.createElement('div');
      hidden.className = 'card hidden';
      hidden.textContent = '🂠';
      dealerCardsDiv.appendChild(hidden);
    }
    dealerSumDiv.textContent = '?';
  } else {
    // показать все карты дилера
    for (const c of game.dealer) dealerCardsDiv.appendChild(makeCardNode(c));
    dealerSumDiv.textContent = calcValue(game.dealer);
  }

  // игрок
  for (const c of game.player) playerCardsDiv.appendChild(makeCardNode(c));
  playerSumDiv.textContent = calcValue(game.player);

  // кнопки
  hitBtn.disabled = !game.inRound;
  standBtn.disabled = !game.inRound;
  doubleBtn.disabled = !game.inRound || !game.canDouble;
  newBtn.style.display = game.inRound ? 'none' : 'inline-block';
}

function makeCardNode(card) {
  const d = document.createElement('div');
  d.className = 'card';
  d.textContent = cardToText(card);
  return d;
}

function showStatus(text) {
  statusDiv.textContent = text;
}

// --- Game flow ---
function startGame() {
  // инициализация
  game.deck = createDeck(4);
  shuffle(game.deck);
  game.player = [];
  game.dealer = [];
  game.doubled = false;
  game.inRound = true;
  game.bet = Math.max(1, parseInt(betInput.value || 10, 10));
  // проверка баланса
  if (game.bet > game.money) {
    showStatus('Ставка больше, чем баланс! Установлена ставка = баланс.');
    game.bet = game.money;
    betInput.value = game.bet;
  }
  // раздача
  game.player.push(draw());
  game.dealer.push(draw());
  game.player.push(draw());
  game.dealer.push(draw());

  // дабл доступен пока у игрока 2 карты и он не делал ход
  game.canDouble = (game.player.length === 2);
  showStatus(`Игра началась. Ставка: ${game.bet}`);
  // скрываем старт, показываем игровую зону
  startScreen.style.display = 'none';
  gameArea.style.display = 'block';

  updateUI();

  // если у игрока 21 сразу — конец раунда (блекджек)
  const pv = calcValue(game.player);
  if (pv === 21) {
    endRound();
  }
}

function playerHit() {
  if (!game.inRound) return;
  game.player.push(draw());
  // после любого "hit" дабл больше недоступен
  game.canDouble = false;
  updateUI();

  if (calcValue(game.player) > 21) {
    showStatus('Перебор! Вы проиграли ставку.');
    endRound();
  }
}

function playerDouble() {
  if (!game.inRound) return;
  // правило: дабл доступен только при двух картах (обычно) и достаточном балансе
  if (!game.canDouble || game.player.length !== 2) {
    showStatus('Дабл недоступен (только на первых двух картах).');
    return;
  }
  if (game.bet * 2 > game.money) {
    showStatus('Недостаточно средств для удвоения ставки.');
    return;
  }
  // удваиваем ставку
  game.bet *= 2;
  game.doubled = true;
  // даём ровно одну карту и немедленно завершаем ход игрока
  game.player.push(draw());
  game.canDouble = false;
  updateUI();

  // после дабла автоматически переходим к дилеру
  endRound();
}

function playerStand() {
  if (!game.inRound) return;
  endRound();
}

function dealerPlay() {
  // дилер берёт, пока < 17
  while (calcValue(game.dealer) < 17) {
    game.dealer.push(draw());
  }
}

function endRound() {
  // завершение раунда
  game.inRound = false;
  // дилер играет
  dealerPlay();
  updateUI();

  const pv = calcValue(game.player);
  const dv = calcValue(game.dealer);
  let resultText = '';
  if (pv > 21) {
    resultText = `Вы перебрали (${pv}). Проигрыш.`;
    game.money -= game.bet;
  } else if (dv > 21) {
    resultText = `Дилер перебрал (${dv}). Вы выиграли!`;
    game.money += game.bet;
  } else if (pv > dv) {
    resultText = `Вы ${pv} vs ${dv} — победа!`;
    game.money += game.bet;
  } else if (pv < dv) {
    resultText = `Вы ${pv} vs ${dv} — проигрыш.`;
    game.money -= game.bet;
  } else {
    resultText = `Ничья ${pv} vs ${dv}. Ставка возвращена.`;
    // баланс не меняем
  }

  showStatus(resultText + ` Баланс: ${game.money}`);
  updateUI();

  // показываем кнопку "Новая игра"
  newBtn.style.display = 'inline-block';
}

// --- Event listeners ---
startBtn.addEventListener('click', () => {
  startGame();
});

hitBtn.addEventListener('click', () => {
  playerHit();
});

standBtn.addEventListener('click', () => {
  playerStand();
});

doubleBtn.addEventListener('click', () => {
  playerDouble();
});

newBtn.addEventListener('click', () => {
  // вернуться к стартовому экран
  game.inRound = false;
  startScreen.style.display = 'block';
  gameArea.style.display = 'none';
  showStatus('');
  newBtn.style.display = 'none';
  // оставляем баланс и ставку как есть
  moneyDisplay.textContent = game.money;
});

// --- Инициализация отображения ---
updateUI();
