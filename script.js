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

// Cycle the text
function animateText() {
  drawIntroText();
  if (waitTime > 0) {
    waitTime -= 16;
    requestAnimationFrame(animateText);
    return;
  }

  // Fade in
  if (fadingIn) {
    textAlpha += 0.02;
    if (textAlpha >= 1) {
      textAlpha = 1;
      fadingIn = false;
      setTimeout(() => {
        fadingOut = true;
        requestAnimationFrame(animateText);
      }, 1500);
      return; // Pause at full opacity
    }
  }
  // Fade out
  else if (fadingOut) {
    textAlpha -= 0.02;
    if (textAlpha <= 0) {
      textAlpha = 0;
      fadingOut = false;
      currentTextIndex++;
      if (currentTextIndex < introTexts.length) {
        fadingIn = true; // start next line
        requestAnimationFrame(animateText);
        return;
      } else {
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
    requestAnimationFrame(animateText);
  });
});

// Setup level
const shipImage = new Image();
shipImage.src = "assets/background.jpg";

let level1Running = false;

function drawLevel1() {
  if (shipImage.complete && shipImage.naturalWidth !== 0) {
    ctx.drawImage(shipImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#101024";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.fillStyle = "white";
  ctx.font = "30px Montserrat";
  ctx.textAlign = "center";
  ctx.fillText("LEVEL 1 — The Ship Interior", canvas.width / 2, 60);
}

function level1Loop() {
  if (!level1Running) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawLevel1();
  requestAnimationFrame(level1Loop);
}

function startLevel1() {
  level1Running = true;
  requestAnimationFrame(level1Loop);
}
