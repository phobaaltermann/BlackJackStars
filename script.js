body {
  margin: 0;
  padding: 0;
  background: #04320f;
  color: #f4f4f4;
  font-family: Arial, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.wrapper {
  width: 100%;
  max-width: 600px;
  background: #0d3b1b;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 0 15px rgba(0,0,0,0.7);
}

header {
  text-align: center;
}

header h1 {
  margin: 0;
  color: gold;
  font-size: 28px;
  text-shadow: 1px 1px 3px #000;
}

.info {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  font-size: 16px;
}

.game-area {
  margin-top: 20px;
}

.hand {
  margin-bottom: 20px;
}

.cards {
  display: flex;
  justify-content: center;
  margin: 10px 0;
}

.cards img {
  width: 60px;
  margin: 0 5px;
  border-radius: 6px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.5);
  transition: transform 0.2s;
}
.cards img:hover {
  transform: scale(1.1);
}

.score {
  text-align: center;
  margin-top: 5px;
  font-size: 18px;
}

.message {
  text-align: center;
  font-size: 20px;
  margin: 15px 0;
  font-weight: bold;
}

footer {
  text-align: center;
}

.bet-controls button {
  background: #ffda00;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  margin: 0 10px;
  font-size: 16px;
  cursor: pointer;
}

.actions {
  margin-top: 10px;
}

.actions button {
  background: #1db954;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  margin: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.actions button:hover {
  background: #1ac152;
}
