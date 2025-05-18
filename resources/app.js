/// <reference path="./js/neutralino.d.ts" />

Neutralino.init();

Neutralino.os.setTray({
  icon: "/resources/favicon.png",
  menuItems: [{ id: "quit", text: "Quit" }],
});

Neutralino.events.on("trayMenuItemClicked", (event) => {
  if (event.detail.id === "quit") Neutralino.app.exit();
});

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const statsBox = document.getElementById("statsBox");
const healthDisplay = document.getElementById("health");
const messageBox = document.getElementById("messageBox");

const collectSound = new Audio("sounds/collect.wav");
const hitSound = new Audio("sounds/hit.wav");
const gameOverSound = new Audio("sounds/gameover.wav");

let score = 0;
let health = 100;
let gameRunning = true;

const playerSize = 25;
const playerSpeed = 1;

let playerX = canvas.width / 2;
let playerY = canvas.height / 2;
let dx = 0,
  dy = 0;

let obstacleSize = 30,
  obstacleSpawnRate = 120,
  obstacleSpeed = 3;
let obstacles = [];

let resourceSize = 25,
  resourceSpeed = 1.5,
  resourceSpawnRate = 200;
let resources = [];

let frameCount = 0;

function createStar() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2,
    speed:
      (Math.random() * 0.5 + 0.2) * ((obstacleSpeed + resourceSpeed) / 5),
  };
}

const numStars = 50;
const stars = Array.from({ length: numStars }, createStar);

function resizeCanvas() {
  const scale = Math.min(window.innerWidth / 800, window.innerHeight / 600);
  canvas.style.width = `${800 * scale}px`;
  canvas.style.height = `${600 * scale}px`;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function drawPlayer() {
  ctx.fillStyle = "#00FFFF";
  ctx.fillRect(
    playerX - playerSize / 2,
    playerY - playerSize / 2,
    playerSize,
    playerSize
  );
}

function drawObstacle(obstacle) {
  ctx.fillStyle = "#FF0000";
  ctx.fillRect(
    obstacle.x - obstacleSize / 2,
    obstacle.y - obstacleSize / 2,
    obstacleSize,
    obstacleSize
  );
}

function drawResource(resource) {
  ctx.fillStyle = "#00FF00";
  ctx.beginPath();
  ctx.arc(resource.x, resource.y, resourceSize / 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawStar(star) {
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
  ctx.fill();
}

function isColliding(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx ** 2 + dy ** 2) < (r1 + r2) / 2;
}

function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
}

let lastStats = "",
  lastHealth = "";

function updateStatsDisplay() {
  const newStats = `
    Score: ${score}
    <br> Time: ${Math.floor(frameCount / 60)}s
    <br> Obstacles every ${(obstacleSpawnRate / 60).toFixed(2)}s
    <br> Obstacles speed: ${obstacleSpeed.toFixed(2)}
    <br> Resources every ${(resourceSpawnRate / 60).toFixed(2)}s
    <br> Resources speed: ${resourceSpeed.toFixed(2)}
  `;
  if (statsBox.innerHTML !== newStats) statsBox.innerHTML = newStats;
}

function updateHealthDisplay() {
  const newHealth = `Health: ${health}%`;
  if (healthDisplay.textContent !== newHealth) {
    healthDisplay.textContent = newHealth;

    if (health > 60) healthDisplay.style.color = "#4CAF50";
    else if (health > 30) healthDisplay.style.color = "#FFC107";
    else healthDisplay.style.color = "#F44336";
  }
}

function update() {
  if (!gameRunning) return;

  frameCount++;

  dx *= 0.8;
  dy *= 0.8;

  if (keysPressed["ArrowUp"] || keysPressed["w"]) dy += -playerSpeed;
  if (keysPressed["ArrowDown"] || keysPressed["s"]) dy += playerSpeed;
  if (keysPressed["ArrowLeft"] || keysPressed["a"]) dx += -playerSpeed;
  if (keysPressed["ArrowRight"] || keysPressed["d"]) dx += playerSpeed;

  playerX += dx;
  playerY += dy;

  playerX = Math.max(
    playerSize / 2,
    Math.min(canvas.width - playerSize / 2, playerX)
  );
  playerY = Math.max(
    playerSize / 2,
    Math.min(canvas.height - playerSize / 2, playerY)
  );

  if (frameCount % obstacleSpawnRate === 0) {
    obstacles.push({
      x: Math.random() * canvas.width,
      y: -obstacleSize,
    });
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.y += obstacleSpeed;

    if (isColliding(playerX, playerY, playerSize, obs.x, obs.y, obstacleSize)) {
      health -= 10;
      playSound(hitSound);
      obstacles.splice(i, 1);
      updateHealthDisplay();

      if (health <= 0) gameOver();
    } else if (obs.y > canvas.height + obstacleSize) {
      obstacles.splice(i, 1);
    }
  }

  if (frameCount % resourceSpawnRate === 0) {
    resources.push({
      x: Math.random() * canvas.width,
      y: -resourceSize,
    });
  }

  if (frameCount % 60 === 0) updateStatsDisplay();

  if (frameCount % 600 === 0) {
    if (obstacleSpeed < 6) obstacleSpeed += 0.2;
    if (resourceSpeed < 4.4) resourceSpeed += 0.2;
    if (obstacleSpawnRate > 50) obstacleSpawnRate -= 8;
    if (resourceSpawnRate > 100) resourceSpawnRate -= 8;
  }

  for (let i = resources.length - 1; i >= 0; i--) {
    const res = resources[i];
    res.y += resourceSpeed;

    if (isColliding(playerX, playerY, playerSize, res.x, res.y, resourceSize)) {
      score += 5;
      health = Math.min(100, health + 1);
      playSound(collectSound);
      resources.splice(i, 1);
      updateStatsDisplay();
      updateHealthDisplay();
    } else if (res.y > canvas.height + resourceSize) {
      resources.splice(i, 1);
    }
  }

  for (let i = 0; i < stars.length; i++) {
    stars[i].y += stars[i].speed;
    if (stars[i].y > canvas.height) {
      stars[i] = createStar();
      stars[i].y = 0;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < stars.length; i++) drawStar(stars[i]);
  drawPlayer();

  for (let i = 0; i < obstacles.length; i++) drawObstacle(obstacles[i]);
  for (let i = 0; i < resources.length; i++) drawResource(resources[i]);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function gameOver() {
  gameRunning = false;
  playSound(gameOverSound);

  Neutralino.os
    .showMessageBox(
      "Game Over!",
      `Your final score is: ${score}.`,
      "RETRY_CANCEL",
      "INFO"
    )
    .then((result) => {
      if (result === "RETRY") window.location.reload();
      else Neutralino.app.exit();
    });
}

const keysPressed = {};

document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;
  keysPressed[e.key] = true;
});

document.addEventListener("keyup", (e) => {
  if (!gameRunning) return;
  keysPressed[e.key] = false;
});

updateStatsDisplay();
updateHealthDisplay();
gameLoop();
