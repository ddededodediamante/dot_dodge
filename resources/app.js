/// <reference path="./js/neutralino.d.ts" />

Neutralino.init();

Neutralino.events.on("ready", () => {
  Neutralino.os.setTray({
    icon: "./favicon.ico",
  });
});

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const healthDisplay = document.getElementById("health");
const messageBox = document.getElementById("messageBox");

const collectSound = new Audio("collect.wav");
const hitSound = new Audio("hit.wav");
const gameOverSound = new Audio("gameover.wav");

let score = 0;
let health = 100;
let gameRunning = true;

const playerSize = 20;

let playerX = canvas.width / 2;
let playerY = canvas.height / 2;
const playerSpeed = 1;
let dx = 0;
let dy = 0;

const obstacleSize = 30;
const obstacleSpeed = 2;
const obstacles = [];
const obstacleSpawnRate = 120;
let frameCount = 0;

const resourceSize = 25;
const resourceSpeed = 1.5;
const resources = [];
const resourceSpawnRate = 200;

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

  if (playerX < playerSize / 2) playerX = playerSize / 2;
  if (playerX > canvas.width - playerSize / 2)
    playerX = canvas.width - playerSize / 2;
  if (playerY < playerSize / 2) playerY = playerSize / 2;
  if (playerY > canvas.height - playerSize / 2)
    playerY = canvas.height - playerSize / 2;

  if (frameCount % obstacleSpawnRate === 0) {
    obstacles.push({
      x: Math.random() * canvas.width,
      y: -obstacleSize,
    });
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].y += obstacleSpeed;

    const dist = Math.sqrt(
      Math.pow(playerX - obstacles[i].x, 2) +
        Math.pow(playerY - obstacles[i].y, 2)
    );
    if (dist < playerSize / 2 + obstacleSize / 2) {
      health -= 10;

      hitSound.currentTime = 0;
      hitSound.play();
      obstacles.splice(i, 1);

      updateHealthDisplay();

      if (health <= 0) {
        gameOver();
      }
    } else if (obstacles[i].y > canvas.height + obstacleSize) {
      obstacles.splice(i, 1);
    }
  }

  if (frameCount % resourceSpawnRate === 0) {
    resources.push({
      x: Math.random() * canvas.width,
      y: -resourceSize,
    });
  }

  for (let i = resources.length - 1; i >= 0; i--) {
    resources[i].y += resourceSpeed;

    const dist = Math.sqrt(
      Math.pow(playerX - resources[i].x, 2) +
        Math.pow(playerY - resources[i].y, 2)
    );
    if (dist < playerSize / 2 + resourceSize / 2) {
      score += 5;
      health = Math.min(100, health + 1);

      collectSound.currentTime = 0;
      collectSound.play();

      resources.splice(i, 1);

      updateScoreDisplay();
      updateHealthDisplay();
    } else if (resources[i].y > canvas.height + resourceSize) {
      resources.splice(i, 1);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPlayer();

  obstacles.forEach(drawObstacle);
  resources.forEach(drawResource);
}

function gameLoop() {
  update();
  draw();

  requestAnimationFrame(gameLoop);
}

function updateScoreDisplay() {
  scoreDisplay.textContent = `Score: ${score}`;
}

function updateHealthDisplay() {
  healthDisplay.textContent = `Health: ${health}`;

  if (health > 60) {
    healthDisplay.style.color = "#4CAF50";
  } else if (health > 30) {
    healthDisplay.style.color = "#FFC107";
  } else {
    healthDisplay.style.color = "#F44336";
  }
}

function gameOver() {
  gameRunning = false;

  gameOverSound.play();

  Neutralino.os
    .showMessageBox(
      "Game Over!",
      `Your final score is: ${score}.`,
      "RETRY_CANCEL",
      "INFO"
    )
    .then(result => {
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

updateScoreDisplay();
updateHealthDisplay();
gameLoop();
