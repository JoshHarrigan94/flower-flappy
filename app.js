/* Flower Flappy - app.js */

const pollenCountEl = document.getElementById("pollenCount");
const bouquetMoodEl = document.getElementById("bouquetMood");

const playBeeBtn = document.getElementById("playBeeBtn");
const arrangeBtn = document.getElementById("arrangeBtn");
const refreshBouquetBtn = document.getElementById("refreshBouquetBtn");

const gameOverlay = document.getElementById("gameOverlay");
const closeGameBtn = document.getElementById("closeGameBtn");
const restartGameBtn = document.getElementById("restartGameBtn");
const scoreDisplay = document.getElementById("scoreDisplay");
const gameInstructions = document.getElementById("gameInstructions");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let state = {
  pollen: Number(localStorage.getItem("flowerFlappyPollen")) || 0,
  freshness: Number(localStorage.getItem("flowerFlappyFreshness")) || 100,
  lastVisit: Number(localStorage.getItem("flowerFlappyLastVisit")) || Date.now()
};

let game = {
  running: false,
  over: false,
  score: 0,
  frame: 0,
  bee: {
    x: 90,
    y: 240,
    r: 16,
    vy: 0
  },
  stems: []
};

function saveState() {
  localStorage.setItem("flowerFlappyPollen", state.pollen);
  localStorage.setItem("flowerFlappyFreshness", state.freshness);
  localStorage.setItem("flowerFlappyLastVisit", Date.now());
}

function applyTimeDecay() {
  const now = Date.now();
  const hoursAway = (now - state.lastVisit) / 1000 / 60 / 60;
  const decay = Math.floor(hoursAway * 2);

  if (decay > 0) {
    state.freshness = Math.max(0, state.freshness - decay);
    state.lastVisit = now;
    saveState();
  }
}

function updateUI() {
  pollenCountEl.textContent = state.pollen;

  if (state.freshness > 75) {
    bouquetMoodEl.textContent = "Fresh and happy";
  } else if (state.freshness > 45) {
    bouquetMoodEl.textContent = "Starting to droop";
  } else if (state.freshness > 15) {
    bouquetMoodEl.textContent = "Needs a little love";
  } else {
    bouquetMoodEl.textContent = "Very wilted";
  }

  document.querySelectorAll(".flower").forEach((flower) => {
    flower.style.opacity = 0.45 + state.freshness / 180;
    flower.style.filter = `saturate(${0.45 + state.freshness / 100})`;
  });
}

function addPollen(amount) {
  state.pollen += amount;
  saveState();
  updateUI();
}

function refreshBouquet() {
  const cost = 10;

  if (state.pollen < cost) {
    bouquetMoodEl.textContent = "You need 10 pollen to refresh";
    return;
  }

  state.pollen -= cost;
  state.freshness = 100;
  saveState();
  updateUI();
}

function arrangeBouquet() {
  const flowers = document.querySelectorAll(".flower");

  flowers.forEach((flower) => {
    const x = 25 + Math.random() * 45;
    const y = 85 + Math.random() * 65;
    const rot = -12 + Math.random() * 24;

    flower.style.left = `${x}%`;
    flower.style.bottom = `${y}px`;
    flower.style.transform = `rotate(${rot}deg)`;
  });

  state.freshness = Math.min(100, state.freshness + 3);
  saveState();
  updateUI();
}

function openGame() {
  gameOverlay.classList.remove("hidden");
  resetGame();
  drawGame();
}

function closeGame() {
  gameOverlay.classList.add("hidden");
  game.running = false;
}

function resetGame() {
  game.running = false;
  game.over = false;
  game.score = 0;
  game.frame = 0;
  game.bee.x = 90;
  game.bee.y = 240;
  game.bee.vy = 0;
  game.stems = [];

  scoreDisplay.textContent = "0";
  restartGameBtn.textContent = "Start";
  gameInstructions.textContent = "Tap to flap. Collect pollen. Avoid stems.";
}

function startGame() {
  if (game.running) return;

  if (game.over) {
    resetGame();
  }

  game.running = true;
  restartGameBtn.textContent = "Flap";
  gameInstructions.textContent = "Keep the bee floating.";

  requestAnimationFrame(gameLoop);
}

function flap() {
  if (!game.running) {
    startGame();
    return;
  }

  game.bee.vy = -6.5;
}

function spawnStem() {
  const gap = 145;
  const topHeight = 60 + Math.random() * 220;

  game.stems.push({
    x: canvas.width + 20,
    width: 48,
    top: topHeight,
    bottom: topHeight + gap,
    passed: false
  });
}

function updateGame() {
  game.frame++;

  game.bee.vy += 0.32;
  game.bee.y += game.bee.vy;

  if (game.frame % 95 === 0) {
    spawnStem();
  }

  game.stems.forEach((stem) => {
    stem.x -= 2.4;

    if (!stem.passed && stem.x + stem.width < game.bee.x) {
      stem.passed = true;
      game.score++;
      scoreDisplay.textContent = game.score;
    }
  });

  game.stems = game.stems.filter((stem) => stem.x > -80);

  checkCollisions();
}

function checkCollisions() {
  if (game.bee.y - game.bee.r < 0 || game.bee.y + game.bee.r > canvas.height) {
    endGame();
    return;
  }

  for (const stem of game.stems) {
    const withinX =
      game.bee.x + game.bee.r > stem.x &&
      game.bee.x - game.bee.r < stem.x + stem.width;

    const hitsTop = game.bee.y - game.bee.r < stem.top;
    const hitsBottom = game.bee.y + game.bee.r > stem.bottom;

    if (withinX && (hitsTop || hitsBottom)) {
      endGame();
      return;
    }
  }
}

function endGame() {
  game.running = false;
  game.over = true;

  const reward = Math.max(1, game.score);
  addPollen(reward);

  gameInstructions.textContent = `You earned ${reward} pollen.`;
  restartGameBtn.textContent = "Play again";
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawStems();
  drawBee();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#bde7ff");
  gradient.addColorStop(1, "#e8fff1");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.beginPath();
  ctx.arc(70, 80, 28, 0, Math.PI * 2);
  ctx.arc(100, 80, 36, 0, Math.PI * 2);
  ctx.arc(135, 82, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.arc(250, 145, 20, 0, Math.PI * 2);
  ctx.arc(276, 145, 28, 0, Math.PI * 2);
  ctx.arc(305, 146, 18, 0, Math.PI * 2);
  ctx.fill();
}

function drawStems() {
  game.stems.forEach((stem) => {
    ctx.fillStyle = "#69b578";

    ctx.fillRect(stem.x, 0, stem.width, stem.top);
    ctx.fillRect(stem.x, stem.bottom, stem.width, canvas.height - stem.bottom);

    ctx.fillStyle = "#8fd694";
    ctx.fillRect(stem.x - 6, stem.top - 18, stem.width + 12, 18);
    ctx.fillRect(stem.x - 6, stem.bottom, stem.width + 12, 18);
  });
}

function drawBee() {
  const bee = game.bee;

  ctx.save();
  ctx.translate(bee.x, bee.y);
  ctx.rotate(bee.vy * 0.04);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.ellipse(-8, -16, 10, 16, -0.4, 0, Math.PI * 2);
  ctx.ellipse(8, -16, 10, 16, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffd86b";
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2f3542";
  ctx.fillRect(-8, -13, 4, 26);
  ctx.fillRect(3, -13, 4, 26);

  ctx.beginPath();
  ctx.arc(10, -4, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function gameLoop() {
  if (!game.running) {
    drawGame();
    return;
  }

  updateGame();
  drawGame();

  requestAnimationFrame(gameLoop);
}

playBeeBtn.addEventListener("click", openGame);
closeGameBtn.addEventListener("click", closeGame);
restartGameBtn.addEventListener("click", flap);
refreshBouquetBtn.addEventListener("click", refreshBouquet);
arrangeBtn.addEventListener("click", arrangeBouquet);

canvas.addEventListener("click", flap);
canvas.addEventListener("touchstart", (event) => {
  event.preventDefault();
  flap();
});

applyTimeDecay();
updateUI();
drawGame();