console.log("Welcome to Celestial Survivor!");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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

// Cycle the text
function animateText() {
  drawIntroText();
  drawSkipPrompt();

  if (introSkipped) {
    stopIntroKeyListener();
    startLevel1();
    return;
  }

  if (waitTime > 0) {
    waitTime -= 16;
    requestAnimationFrame(animateText);
    return;
  }

  if (fadingIn) {
    textAlpha += 0.02;
    if (textAlpha >= 1) {
      textAlpha = 1;
      fadingIn = false;
      setTimeout(() => {
        fadingOut = true;
        requestAnimationFrame(animateText);
      }, 1500);
      return;
    }
  } else if (fadingOut) {
    textAlpha -= 0.02;
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
  }

  requestAnimationFrame(animateText);
}

// Start the intro text when you click the play button
playButton.addEventListener("click", () => {
  fadeOutStartScreen(() => {
    canvas.style.display = "block";
    textAlpha = 0;
    fadingIn = true;
    fadingOut = false;
    waitTime = 1000;
    currentTextIndex = 0;

    startIntroKeyListener(); // <-- add this here

    requestAnimationFrame(animateText);
  });
});

// Setup level
const shipImage = new Image();
shipImage.src = "assets/background.jpg";

let level1Running = false;

const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 140,
  width: 40,
  height: 40,
  vx: 0,
  vy: 0,
  speed: 5,
  jumpStrength: 15,
  onGround: false,
};

const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function updatePlayer() {
  if (keys["ArrowLeft"]) player.vx = -player.speed;
  else if (keys["ArrowRight"]) player.vx = player.speed;
  else player.vx = 0;

  if (keys["ArrowUp"] && player.onGround) {
    player.vy = -player.jumpStrength;
    player.onGround = false;
  }

  player.vy += 0.7;

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

  if (shipImage.complete && shipImage.naturalWidth !== 0) {
    ctx.drawImage(shipImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.fillStyle = "#555555";
  ctx.fillRect(0, canvas.height - 50, canvas.width, 100);

  ctx.fillStyle = "white";
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function level1Loop() {
  if (!level1Running) return;
  updatePlayer();
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
