console.log("Welcome to Celestial Survivor!");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("Canvas 2D context not available");
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let resizeRaf = null;
window.addEventListener("resize", () => {
  if (resizeRaf) cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    resizeRaf = null;
  });
});

const startScreen = document.getElementById("startScreen");
const playButton = document.getElementById("playButton");
const playerStats = {
  health: 100,
  maxHealth: 100,
  shipParts: 0,
};

// Define the intro text
const introTexts = [
  "You were piloting the Celestial Voyager...",
  "A sudden surge of energy tears through your ship...",
  "You crash through the atmosphere of an unknown world...",
  "You awaken among twisted skies and strange light, alone...",
  "Find the scattered parts, rebuild your ship... and survive.",
];

let currentTextIndex = 0;
let startScreenAlpha = 1;
let textAlpha = 0;
let fadingIn = true;
let fadingOut = false;
let waitTime = 1000;
let introSkipped = false;
let introKeyListener;

const FADE_RATE = 0.0015;
const INITIAL_WAIT = 1000;
const VISIBLE_DURATION = 1500;

let lastAnimTime = null;
let visibleTimer = 0;

const grassImg = new Image();
grassImg.src = "assets/grass.png";

const partImg = new Image();
partImg.src = "assets/part.png";

const shipPart = {
  x: canvas.width - 100,
  y: canvas.height - 120,
  width: 40,
  height: 40,
  collected: false,
};

function drawShipPart(time) {
  if (!shipPart.collected && partImg.complete && partImg.naturalWidth) {
    const hover = Math.sin(time / 300) * 5;
    ctx.save();
    ctx.shadowColor = "#00e0ff";
    ctx.shadowBlur = 20;
    ctx.drawImage(
      partImg,
      shipPart.x,
      shipPart.y + hover,
      shipPart.width,
      shipPart.height
    );
    ctx.restore();
  }
}

let grassPattern = null;
grassImg.onload = () => {
  grassPattern = ctx.createPattern(grassImg, "repeat-x");
};

function drawGround() {
  const floorY = canvas.height - 50;

  if (grassPattern) {
    ctx.save();
    ctx.translate(0, floorY);
    ctx.fillStyle = grassPattern;
    ctx.fillRect(0, 0, canvas.width, 100);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(0, floorY);
    ctx.fillStyle = "#1d3b2a";
    ctx.fillRect(0, 0, canvas.width, 100);
    ctx.restore();
  }
}

const plantImages = [
  "assets/plant1.png",
  "assets/plant2.png",
  "assets/plant3.png",
].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

const floorY = canvas.height - 50;

const plants = Array.from({ length: 8 }).map((_, i) => ({
  x: (canvas.width / 8) * i + Math.random() * 40 - 20,
  y: floorY,
  scale: 0.1 + Math.random() * 0.08,
  alpha: 0.7 + Math.random() * 0.15,
  img: plantImages[Math.floor(Math.random() * plantImages.length)],
}));

function drawPlants(time) {
  plants.forEach((p, i) => {
    if (p.img.complete && p.img.naturalWidth !== 0) {
      const width = p.img.naturalWidth * p.scale;
      const height = p.img.naturalHeight * p.scale;

      const sway = Math.sin(time / 800 + i) * 3;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.drawImage(p.img, p.x + sway, p.y - height, width, height);
      ctx.restore();
    }
  });
}

function drawUI() {
  const paddingX = 25;
  const paddingY = 40;
  const boxWidth = 260;
  const boxHeight = 90;

  ctx.save();
  ctx.fillStyle = "rgba(15, 20, 30, 0.6)";
  ctx.strokeStyle = "rgba(80, 200, 255, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(paddingX - 10, paddingY - 30, boxWidth, boxHeight, 10);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  const barWidth = 200;
  const barHeight = 18;
  const healthPercent = playerStats.health / playerStats.maxHealth;

  const healthX = paddingX;
  const healthY = paddingY;
  ctx.fillStyle = "rgba(50, 50, 50, 0.8)";
  ctx.fillRect(healthX, healthY, barWidth, barHeight);

  const grad = ctx.createLinearGradient(healthX, 0, healthX + barWidth, 0);
  grad.addColorStop(0, "#00ff99");
  grad.addColorStop(0.5, "#00cc66");
  grad.addColorStop(1, "#008844");

  ctx.shadowColor = "#00ffcc";
  ctx.shadowBlur = 10;
  ctx.fillStyle = grad;
  ctx.fillRect(healthX, healthY, barWidth * healthPercent, barHeight);

  ctx.shadowBlur = 0;
  ctx.font = "18px 'Orbitron', Montserrat, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText("HEALTH", healthX, healthY - 8);

  const partsX = paddingX;
  const partsY = healthY + barHeight + 32;

  ctx.font = "20px 'Orbitron', Montserrat, sans-serif";
  ctx.fillStyle = "#8fd4ff";
  ctx.shadowColor = "#2be0ff";
  ctx.shadowBlur = 12;
  ctx.fillText(`Ship Parts: ${playerStats.shipParts}`, partsX, partsY);

  ctx.shadowBlur = 0;
}

function drawIntroText() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
  ctx.font = "40px Montserrat";
  ctx.textAlign = "center";
  ctx.fillText(
    introTexts[currentTextIndex],
    canvas.width / 2,
    canvas.height / 2
  );
}

// Function to fade out the screen to black
function fadeOutStartScreen(callback) {
  const fadeInterval = setInterval(() => {
    startScreenAlpha -= 0.02;
    if (startScreenAlpha <= 0) {
      startScreenAlpha = 0;
      clearInterval(fadeInterval);
      startScreen.style.display = "none";
      callback();
    } else {
      startScreen.style.opacity = startScreenAlpha;
    }
  }, 30);
}

function drawSkipPrompt() {
  ctx.fillStyle = "white";
  ctx.font = "20px Montserrat";
  ctx.textAlign = "right";
  ctx.fillText("Press ENTER to skip", canvas.width - 20, canvas.height - 20);
}

// Cycle the text (time-based)
function animateText(timestamp) {
  if (introSkipped) {
    stopIntroKeyListener();
    startLevel1();
    return;
  }

  if (!lastAnimTime) lastAnimTime = timestamp;
  const dt = timestamp - lastAnimTime;
  lastAnimTime = timestamp;

  drawIntroText();
  drawSkipPrompt();

  if (waitTime > 0) {
    waitTime -= dt;
    requestAnimationFrame(animateText);
    return;
  }

  if (fadingIn) {
    textAlpha += FADE_RATE * dt;
    if (textAlpha >= 1) {
      textAlpha = 1;
      fadingIn = false;
      visibleTimer = VISIBLE_DURATION;
      requestAnimationFrame(animateText);
      return;
    }
  } else if (fadingOut) {
    textAlpha -= FADE_RATE * dt;
    if (textAlpha <= 0) {
      textAlpha = 0;
      fadingOut = false;
      currentTextIndex++;
      if (currentTextIndex < introTexts.length) {
        fadingIn = true;
        requestAnimationFrame(animateText);
        return;
      } else {
        stopIntroKeyListener();
        startLevel1();
        return;
      }
    }
  } else {
    // fully visible period before starting fade out
    if (visibleTimer > 0) {
      visibleTimer -= dt;
      requestAnimationFrame(animateText);
      return;
    } else {
      fadingOut = true;
    }
  }

  requestAnimationFrame(animateText);
}

// Start the intro text when you click the play button
playButton.addEventListener("click", () => {
  playButton.disabled = true;
  fadeOutStartScreen(() => {
    canvas.style.display = "block";
    textAlpha = 0;
    fadingIn = true;
    fadingOut = false;
    waitTime = INITIAL_WAIT;
    visibleTimer = 0;
    currentTextIndex = 0;
    lastAnimTime = null;

    startIntroKeyListener();
    requestAnimationFrame(animateText);
  });
});

// Setup level
const backgroundImage = new Image();
backgroundImage.src = "assets/background.jpg";

let level1Running = false;

const spacemanImg = new Image();
spacemanImg.src = "assets/spritesheet.png";

const sprite = {
  frameWidth: 333,
  frameHeight: 499.25,
  totalFrames: 4,
  frameTimer: 0,
  frameInterval: 120,
  currentFrame: 0,
  direction: "right",
};

const player = {
  x: 20,
  y: canvas.height - 140,
  width: 40,
  height: 40,
  vx: 0,
  vy: 0,
  speed: 4.5,
  jumpStrength: 16.5,
  gravity: 0.8,
  onGround: false,
};

const keys = {};
let jumpKeyHeld = false;

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === "ArrowUp") jumpKeyHeld = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
  if (e.key === "ArrowUp") jumpKeyHeld = false;
});

function updatePlayer() {
  if (keys["ArrowLeft"]) player.vx = -player.speed;
  else if (keys["ArrowRight"]) player.vx = player.speed;
  else player.vx = 0;

  if (keys["ArrowUp"] && player.onGround) {
    player.vy = -player.jumpStrength;
    player.onGround = false;
  }

  if (!player.onGround) {
    player.vy += player.gravity;
    if (!jumpKeyHeld && player.vy < -4) player.vy = -4;
  }

  let nextX = player.x + player.vx;
  let nextY = player.y + player.vy;

  player.onGround = false;
  for (const p of platforms.slice(1)) {
    const horiz = nextX < p.x + p.width && nextX + player.width > p.x;
    const wasAbove = player.y + player.height <= p.y;
    const willCrossTop = nextY + player.height >= p.y;
    if (horiz && wasAbove && willCrossTop) {
      nextY = p.y - player.height;
      player.vy = 0;
      player.onGround = true;
    }
  }

  const floorY = canvas.height - 50;
  if (nextY + player.height >= floorY) {
    nextY = floorY - player.height;
    player.vy = 0;
    player.onGround = true;
  }

  player.x = Math.max(0, Math.min(canvas.width - player.width, nextX));
  player.y = nextY;

  if (
    !shipPart.collected &&
    player.x < shipPart.x + shipPart.width &&
    player.x + player.width > shipPart.x &&
    player.y < shipPart.y + shipPart.height &&
    player.y + player.height > shipPart.y
  ) {
    shipPart.collected = true;
    playerStats.shipParts++;
    console.log("Part collected!");
  }
}

function drawLevel1() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (backgroundImage.complete && backgroundImage.naturalWidth !== 0) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawPlants(performance.now());
  drawGround();
  drawPlatforms();
  drawShipPart(performance.now());

  const row = sprite.direction === "right" ? 3 : 2;
  const frameX = sprite.currentFrame * sprite.frameWidth;
  const frameY = row * sprite.frameHeight;

  const aspectRatio = sprite.frameHeight / sprite.frameWidth;
  const drawWidth = 50;
  const drawHeight = drawWidth * aspectRatio;

  const offsetY = 9;
  const offsetX = 7;

  ctx.drawImage(
    spacemanImg,
    frameX,
    frameY,
    sprite.frameWidth,
    sprite.frameHeight,
    player.x - offsetX,
    player.y - (drawHeight - player.height) + offsetY,
    drawWidth,
    drawHeight
  );
  drawUI();
}

const platforms = [
  { x: 0, y: canvas.height - 50, width: canvas.width, height: 50 }, // ground
  { x: 250, y: canvas.height - 180, width: 180, height: 15 },
  { x: 500, y: canvas.height - 280, width: 150, height: 15 },
  { x: 750, y: canvas.height - 380, width: 200, height: 15 },
];

function drawPlatforms() {
  ctx.fillStyle = "#444";
  platforms.slice(1).forEach((p) => {
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });
}

function level1Loop() {
  if (!level1Running) return;
  updatePlayer();
  if (player.vx !== 0) {
    sprite.frameTimer += 16;
    if (sprite.frameTimer >= sprite.frameInterval) {
      sprite.frameTimer = 0;
      sprite.currentFrame = (sprite.currentFrame + 1) % sprite.totalFrames;
    }
    sprite.direction = player.vx > 0 ? "right" : "left";
  } else {
    sprite.currentFrame = 0;
  }
  drawLevel1();
  requestAnimationFrame(level1Loop);
}

function startLevel1() {
  level1Running = true;
  requestAnimationFrame(level1Loop);
}

function startIntroKeyListener() {
  introKeyListener = (e) => {
    if (e.key === "Enter") {
      introSkipped = true;
    }
  };
  window.addEventListener("keydown", introKeyListener);
}

function stopIntroKeyListener() {
  if (introKeyListener) {
    window.removeEventListener("keydown", introKeyListener);
    introKeyListener = null;
  }
}
