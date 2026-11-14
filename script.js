const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const startButton = document.getElementById('startButton');

const keys = {
  left: false,
  right: false,
  shoot: false,
};

let gameStarted = false;
let gameOver = false;
let score = 0;
let playerLives = 3;
let level = 1;
let lastFrameTime = 0;
let enemyTimer = 0;
let shootCooldown = 0;
let stars = [];
let bullets = [];
let enemyBullets = [];
let enemies = [];

const player = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  width: 34,
  height: 34,
  speed: 5,
};

function resetGame() {
  score = 0;
  playerLives = 3;
  level = 1;
  gameOver = false;
  bullets = [];
  enemyBullets = [];
  enemies = [];
  stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 2 + 1,
    speed: Math.random() * 1.4 + 0.6,
  }));

  player.x = canvas.width / 2;
  player.y = canvas.height - 60;
  enemyTimer = 0;
  shootCooldown = 0;
  updateHud();
}

function updateHud() {
  scoreEl.textContent = score;
  livesEl.textContent = playerLives;
  levelEl.textContent = level;
}

function spawnEnemy() {
  const size = 26;
  const x = Math.random() * (canvas.width - size * 2) + size;
  enemies.push({
    x,
    y: -size,
    width: size,
    height: size,
    speed: 1.4 + level * 0.25 + Math.random() * 0.8,
    hp: 1,
  });
}

function createBullet(x, y, speed, fromEnemy = false) {
  const bullet = {
    x,
    y,
    radius: fromEnemy ? 5 : 4,
    speed,
    fromEnemy,
  };

  if (fromEnemy) {
    enemyBullets.push(bullet);
  } else {
    bullets.push(bullet);
  }
}

function firePlayerShot() {
  if (!gameStarted || gameOver) return;

  if (shootCooldown > 0) return;

  createBullet(player.x, player.y - 18, -8, false);
  shootCooldown = 180;
}

function updatePlayer() {
  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;
  player.x = Math.max(18, Math.min(canvas.width - 18, player.x));

  if (keys.shoot) firePlayerShot();
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y += bullets[i].speed;
    if (bullets[i].y < -20) bullets.splice(i, 1);
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    enemyBullets[i].y += enemyBullets[i].speed;
    if (enemyBullets[i].y > canvas.height + 20) enemyBullets.splice(i, 1);
  }
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    enemy.y += enemy.speed;

    if (Math.random() < 0.015 + level * 0.002) {
      createBullet(enemy.x, enemy.y + enemy.height / 2, 6, true);
    }

    if (enemy.y > canvas.height + 40) {
      enemies.splice(i, 1);
      playerLives -= 1;
      if (playerLives <= 0) {
        endGame();
      }
      updateHud();
    }
  }
}

function handleCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      const hitX = bullet.x > enemy.x - enemy.width / 2 && bullet.x < enemy.x + enemy.width / 2;
      const hitY = bullet.y > enemy.y - enemy.height / 2 && bullet.y < enemy.y + enemy.height / 2;

      if (hitX && hitY) {
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        score += 10;
        updateHud();
        break;
      }
    }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const bullet = enemyBullets[i];
    const playerHitX = bullet.x > player.x - player.width / 2 && bullet.x < player.x + player.width / 2;
    const playerHitY = bullet.y > player.y - player.height / 2 && bullet.y < player.y + player.height / 2;

    if (playerHitX && playerHitY) {
      enemyBullets.splice(i, 1);
      playerLives -= 1;
      if (playerLives <= 0) {
        endGame();
      }
      updateHud();
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const crashX = enemy.x < player.x + player.width && enemy.x > player.x - player.width;
    const crashY = enemy.y < player.y + player.height && enemy.y > player.y - player.height;

    if (crashX && crashY) {
      enemies.splice(i, 1);
      playerLives -= 1;
      if (playerLives <= 0) {
        endGame();
      }
      updateHud();
    }
  }
}

function updateStars() {
  for (const star of stars) {
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = -5;
      star.x = Math.random() * canvas.width;
    }
  }
}

function updateLevel() {
  if (score > 0 && score % 100 === 0) {
    level = Math.floor(score / 100) + 1;
    updateHud();
  }
}

function endGame() {
  gameOver = true;
  gameStarted = false;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ff5555';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 24);
  ctx.fillStyle = '#f8f8f2';
  ctx.font = '24px Arial';
  ctx.fillText(`Puntuación final: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  startButton.textContent = 'Restart Game';
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = '#8be9fd';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(12, 16);
  ctx.lineTo(0, 8);
  ctx.lineTo(-12, 16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#50fa7b';
  ctx.fillRect(-3, 10, 6, 12);
  ctx.restore();
}

function drawBullets() {
  for (const bullet of bullets) {
    ctx.fillStyle = '#ff79c6';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const bullet of enemyBullets) {
    ctx.fillStyle = '#f1fa8c';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    ctx.fillStyle = '#ff5555';
    ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);
    ctx.fillStyle = '#f8f8f2';
    ctx.fillRect(enemy.x - 3, enemy.y + 4, 6, 8);
  }
}

function drawStars() {
  for (const star of stars) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStartOverlay() {
  if (gameStarted || gameOver) return;

  ctx.fillStyle = 'rgba(7, 10, 22, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#8be9fd';
  ctx.font = 'bold 52px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('ASTRONOVA', canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = '20px Arial';
  ctx.fillStyle = '#f8f8f2';
  ctx.fillText('Pulsa Start para comenzar', canvas.width / 2, canvas.height / 2 + 30);
}

function tick(timestamp) {
  const delta = timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  if (gameStarted && !gameOver) {
    updateStars();
    updatePlayer();
    enemyTimer += delta;
    shootCooldown = Math.max(0, shootCooldown - delta);

    if (enemyTimer > Math.max(800, 1200 - level * 75)) {
      spawnEnemy();
      enemyTimer = 0;
    }

    updateBullets();
    updateEnemies();
    handleCollisions();
    updateLevel();
  }

  drawScene();
  requestAnimationFrame(tick);
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();

  if (gameStarted || !gameOver) {
    drawPlayer();
    drawBullets();
    drawEnemies();
  }

  drawStartOverlay();
}

function startGame() {
  resetGame();
  gameStarted = true;
  startButton.textContent = 'Restart Game';
}

startButton.addEventListener('click', startGame);

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keys.left = true;
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keys.right = true;
  if (event.key === ' ' || event.code === 'Space') {
    event.preventDefault();
    keys.shoot = true;
    firePlayerShot();
  }
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keys.left = false;
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keys.right = false;
  if (event.key === ' ' || event.code === 'Space') keys.shoot = false;
});

resetGame();
requestAnimationFrame(tick);

startButton.textContent = 'Start Game';

window.addEventListener('blur', () => {
  keys.left = false;
  keys.right = false;
  keys.shoot = false;
});

