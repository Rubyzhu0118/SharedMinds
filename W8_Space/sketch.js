let photos = [];

// DOM
const topHint = document.getElementById("topHint");
const popupOverlay = document.getElementById("popupOverlay");
const popupTitle = document.getElementById("popupTitle");
const popupText = document.getElementById("popupText");
const popupBtn = document.getElementById("popupBtn");

// game state
let scene = 1;
let popupOpen = false;
let gameWon = false;

let envelopeOpened = false;
let transitionStart = 0;
let isTransitioning = false;
let transitionDuration = 420;

// envelope flow
let waitingSecondLeftToPhoto5 = false;

// confetti
let confettiPieces = [];
let confettiStarted = false;

// clickable zones
let envelopeBox = { x: 0.60, y: 0.56, w: 0.10, h: 0.14 };
let treasureBox = { x: 0.19, y: 0.50, w: 0.16, h: 0.18 };

// small clue areas
let clueAreaScene3 = { x: 0.17, y: 0.60, w: 0.09, h: 0.10 };
let clueAreaScene5 = { x: 0.18, y: 0.54, w: 0.09, h: 0.10 };

function preload() {
  photos.push(loadImage("photos/photo1.png"));
  photos.push(loadImage("photos/photo2.png"));
  photos.push(loadImage("photos/photo3.png"));
  photos.push(loadImage("photos/photo4.png"));
  photos.push(loadImage("photos/photo5.png"));
  photos.push(loadImage("photos/photo6.png"));
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CORNER);
  textFont("Helvetica Neue");
  window.focus();

  showTopHint("Please start by moving forward");
  popupBtn.addEventListener("click", closePopup);
}

function draw() {
  background(0);
  drawCurrentPhotoWithZoom();
  drawSceneOverlays();

  if (scene === 4 && !popupOpen && !envelopeOpened) {
    drawEnvelopeHint();
  }

  if (scene === 6 && !popupOpen && !gameWon) {
    drawTreasureGlow();
  }

  if (gameWon) {
    drawWinOverlay();
    updateAndDrawConfetti();
  }
}

function drawCurrentPhotoWithZoom() {
  const img = photos[scene - 1];
  if (!img) return;

  const imgRatio = img.width / img.height;
  const canvasRatio = width / height;

  let baseW, baseH;

  if (imgRatio > canvasRatio) {
    baseH = height;
    baseW = baseH * imgRatio;
  } else {
    baseW = width;
    baseH = baseW / imgRatio;
  }

  let scaleAmt = 1;

  if (isTransitioning) {
    let t = (millis() - transitionStart) / transitionDuration;
    if (t >= 1) {
      t = 1;
      isTransitioning = false;
    }
    scaleAmt = 1.08 - 0.08 * t;
  }

  const drawW = baseW * scaleAmt;
  const drawH = baseH * scaleAmt;
  const drawX = width / 2 - drawW / 2;
  const drawY = height / 2 - drawH / 2;

  image(img, drawX, drawY, drawW, drawH);
}

function drawSceneOverlays() {
  if (scene === 3) {
    drawMarkedClue(clueAreaScene3, "Something’s there 🤔", "Move forward to check");
  }

  if (scene === 5) {
    drawMarkedClue(clueAreaScene5, "Something’s there 🤔", "Move forward to check");
  }
}

function drawMarkedClue(area, line1, line2) {
  const box = getScaledBox(area);

  noFill();
  stroke(255, 220, 70, 240);
  strokeWeight(3);
  rect(box.x, box.y, box.w, box.h, 10);

  let labelX = box.x + box.w + 14;
  let labelY = box.y - 2;
  let labelW = 220;
  let labelH = 54;

  if (labelX + labelW > width - 16) {
    labelX = box.x - labelW - 14;
  }

  noStroke();
  fill(255, 247, 184, 240);
  rect(labelX, labelY, labelW, labelH, 14);

  fill(35);
  textAlign(LEFT, TOP);
  textSize(16);
  text(line1, labelX + 14, labelY + 9);

  textSize(13);
  fill(55);
  text(line2, labelX + 14, labelY + 30);
}

function drawEnvelopeHint() {
  const box = getScaledBox(envelopeBox);

  // soft glow
  noStroke();
  fill(255, 240, 170, 45 + sin(frameCount * 0.08) * 12);
  rect(box.x - 10, box.y - 10, box.w + 20, box.h + 20, 20);

  // clean main box
  fill(255, 248, 214, 235);
  rect(box.x, box.y, box.w, box.h, 18);

  // icon inside box
  push();
  textAlign(CENTER, CENTER);
  textSize(38);
  textFont("Apple Color Emoji");
  text("📩", box.x + box.w / 2, box.y + box.h / 2 + 4);
  pop();

  // label above
  fill(255, 245, 190, 235);
  rectMode(CENTER);
  rect(box.x + box.w / 2, box.y - 24, 126, 32, 12);

  fill(20);
  textAlign(CENTER, CENTER);
  textSize(15);
  textFont("Helvetica Neue");
  text("Click envelope", box.x + box.w / 2, box.y - 24);

  rectMode(CORNER);
}

function drawTreasureGlow() {
  const box = getScaledBox(treasureBox);

  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;

  // 🎁 emoji（大一点）
  push();
  textAlign(CENTER, CENTER);
  textSize(64);
  textFont("Apple Color Emoji");
  text("🎁", cx, cy + 4);
  pop();

  // ❗❗ cartoon exclamation
  push();
  textAlign(CENTER, CENTER);
  textSize(28);
  textFont("Helvetica Neue");
  fill(255, 70, 90);
  stroke(255);
  strokeWeight(4);

  text("!!", cx, cy - 50);
  pop();


  // gift emoji
  push();
  textAlign(CENTER, CENTER);
  textSize(38);
  textFont("Apple Color Emoji");
  text("🎁", box.x + box.w / 2, box.y + box.h / 2 + 4);
  pop();
}

function drawWinOverlay() {
  fill(0, 90);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(40);
  text("You found the treasure.", width / 2, height / 2 - 28);

  textSize(24);
  text("You found 🍬", width / 2, height / 2 + 18);

  textSize(18);
  text("The scavenger hunt is complete.", width / 2, height / 2 + 56);
}

function startConfetti() {
  confettiPieces = [];
  for (let i = 0; i < 140; i++) {
    confettiPieces.push({
      x: random(width),
      y: random(-height, 0),
      w: random(6, 12),
      h: random(10, 18),
      vx: random(-1.5, 1.5),
      vy: random(2, 5),
      rot: random(TWO_PI),
      rotSpeed: random(-0.08, 0.08),
      color: random([
        [255, 99, 146],
        [255, 206, 84],
        [120, 220, 255],
        [181, 255, 107],
        [206, 160, 255],
        [255, 255, 255]
      ])
    });
  }
  confettiStarted = true;
}

function updateAndDrawConfetti() {
  for (let p of confettiPieces) {
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.rotSpeed;

    push();
    translate(p.x, p.y);
    rotate(p.rot);
    noStroke();
    fill(p.color[0], p.color[1], p.color[2], 220);
    rectMode(CENTER);
    rect(0, 0, p.w, p.h, 2);
    pop();

    if (p.y > height + 30) {
      p.y = random(-120, -20);
      p.x = random(width);
    }
  }
}

function keyPressed() {
  if (popupOpen || gameWon) return;

  if (keyCode === UP_ARROW) {
    handleForward();
  } else if (keyCode === DOWN_ARROW) {
    handleBack();
  } else if (keyCode === LEFT_ARROW) {
    handleLeft();
  } else if (keyCode === RIGHT_ARROW) {
    handleRight();
  }
}

function mousePressed() {
  if (popupOpen || gameWon) return;

  if (scene === 4 && !envelopeOpened) {
    const box = getScaledBox(envelopeBox);
    if (
      mouseX >= box.x &&
      mouseX <= box.x + box.w &&
      mouseY >= box.y &&
      mouseY <= box.y + box.h
    ) {
      openEnvelope();
    }
  }

  if (scene === 6 && !gameWon) {
    const box = getScaledBox(treasureBox);
    if (
      mouseX >= box.x &&
      mouseX <= box.x + box.w &&
      mouseY >= box.y &&
      mouseY <= box.y + box.h
    ) {
      gameWon = true;
      hideTopHint();
      if (!confettiStarted) {
        startConfetti();
      }
    }
  }
}

function handleForward() {
  if (scene === 1) {
    goToScene(2);
    showTopHint("Turn right");
    return;
  }

  if (scene === 2) return;

  if (scene === 3) {
    goToScene(4);
    hideTopHint();
    return;
  }

  if (scene === 4) return;

  if (scene === 5) {
    goToScene(6);
    showTopHint("Click the treasure");
    return;
  }
}

function handleBack() {
  if (scene === 2) {
    goToScene(1);
    showTopHint("Please start by moving forward");
    waitingSecondLeftToPhoto5 = false;
    return;
  }

  if (scene === 3) {
    goToScene(2);
    showTopHint("Turn right");
    waitingSecondLeftToPhoto5 = false;
    return;
  }

  if (scene === 4) {
    goToScene(3);
    showTopHint("Move forward to check");
    waitingSecondLeftToPhoto5 = false;
    return;
  }

  if (scene === 5) {
    waitingSecondLeftToPhoto5 = false;
    goToScene(4);
    if (envelopeOpened) {
      showTopHint("Turn left twice");
    } else {
      hideTopHint();
    }
    return;
  }

  if (scene === 6) {
    goToScene(5);
    showTopHint("Move forward to check");
    waitingSecondLeftToPhoto5 = false;
  }
}

function handleRight() {
  if (scene === 2) {
    hideTopHint();
    goToScene(3);
    showTopHint("Move forward to check");
  }
}

function handleLeft() {
  if (scene === 4 && envelopeOpened) {
    waitingSecondLeftToPhoto5 = true;
    goToScene(2);
    showTopHint("Turn left once more");
    return;
  }

  if (scene === 2 && waitingSecondLeftToPhoto5) {
    waitingSecondLeftToPhoto5 = false;
    hideTopHint();
    goToScene(5);
    showTopHint("Move forward to check");
    return;
  }
}

function openEnvelope() {
  envelopeOpened = true;
  waitingSecondLeftToPhoto5 = false;

  showPopup(
    "Hint",
    "Turn left twice."
  );

  showTopHint("Turn left twice");
}

function showPopup(title, text) {
  popupTitle.textContent = title;
  popupText.textContent = text;
  popupOverlay.classList.remove("hidden");
  popupOpen = true;
}

function closePopup() {
  popupOverlay.classList.add("hidden");
  popupOpen = false;
}

function showTopHint(text) {
  topHint.textContent = text;
  topHint.classList.remove("hidden");
}

function hideTopHint() {
  topHint.classList.add("hidden");
}

function goToScene(newScene) {
  scene = newScene;
  isTransitioning = true;
  transitionStart = millis();
}

function getScaledBox(box) {
  return {
    x: box.x * width,
    y: box.y * height,
    w: box.w * width,
    h: box.h * height
  };
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}