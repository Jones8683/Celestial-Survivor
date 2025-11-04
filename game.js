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

// Define the intro text
const introTexts = [
  "You were piloting the Celestial Voyager...",
  "An unknown energy surge hit your ship...",
  "Your ship crash lands on an alien planet...",
  "You wake up in the wreckage, alone.",
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
  x: canvas.width / 2 - 20,
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
    if (!jumpKeyHeld && player.vy < -4) {
      player.vy = -4;
    }
  }

  player.x += player.vx;
  player.y += player.vy;

  const floorY = canvas.height - 50;
  if (player.y + player.height >= floorY) {
    player.y = floorY - player.height;
    player.vy = 0;
    player.onGround = true;
  }

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width)
    player.x = canvas.width - player.width;
}

function drawLevel1() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (backgroundImage.complete && backgroundImage.naturalWidth !== 0) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.fillStyle = "#555555";
  ctx.fillRect(0, canvas.height - 50, canvas.width, 100);

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
