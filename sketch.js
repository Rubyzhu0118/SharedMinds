let letters = [];
let fontSize = 24;
let formingCircle = false;
let circleCenterX, circleCenterY;
let circleRadius = 160;
let inputBox;
let wordParticles = [];
let showInput = false;
let exploded = false;
let startFrame;
let explosionStartTime;
let showBackButton = false;
let backButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(fontSize);
  textAlign(CENTER, CENTER);
  fill(255);

  resetLetters();
  startFrame = frameCount;
}

function draw() {
  background(0);

  if (!formingCircle && !exploded) {
    // falling letters
    for (let l of letters) {
      l.y += l.speed;
      if (l.y > height - fontSize) l.y = height - fontSize + random(-2, 2);
      text(l.char, l.x, l.y);
    }
    if (frameCount - startFrame > 240) formingCircle = true; // ~4 sec
  } 
  else if (formingCircle && !exploded) {
    // assign targets in circle once
    for (let i = 0; i < letters.length; i++) {
      if (letters[i].targetX === null) {
        let angle = random(TWO_PI);
        let r = circleRadius * sqrt(random());
        letters[i].targetX = circleCenterX + r * cos(angle);
        letters[i].targetY = circleCenterY + r * sin(angle);
      }
    }
    // move letters toward circle
    for (let l of letters) {
      l.x += (l.targetX - l.x) * 0.05;
      l.y += (l.targetY - l.y) * 0.05;
      text(l.char, l.x, l.y);
    }

    // show input box once circle is formed
    if (!showInput) {
      showInput = true;
      inputBox = createInput();
      inputBox.position(width / 2 - 100, circleCenterY + circleRadius + 20);
      inputBox.size(200);
      inputBox.attribute('placeholder', 'Type a word/phrase and press Enter');
      inputBox.input(() => {});
      inputBox.elt.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          explodeWord(inputBox.value());
          inputBox.remove();
          explosionStartTime = millis();
        }
      });
    }
  } 
  else if (exploded) {
    // draw word particles
    for (let i = 0; i < wordParticles.length; i++) {
      let p = wordParticles[i];
      text(p.word, p.x, p.y);
      p.x += random(-0.5, 0.5);
      p.y += random(-0.5, 0.5);
    }

    // slowly add more words each frame
    if (wordParticles.length < width * height / 50) {
      for (let i = 0; i < 2; i++) {
        wordParticles.push({
          word: wordParticles[0].word,
          x: random(width),
          y: random(height)
        });
      }
    }

    // show back button after 5 seconds
    if (!showBackButton && millis() - explosionStartTime > 5000) {
      showBackButton = true;
      backButton = createButton('Back');
      backButton.position(width / 2 - 40, height - 60);
      backButton.size(80, 40);
      backButton.mousePressed(resetAll);
    }
  }
}

// explode typed word gradually
function explodeWord(txt) {
  exploded = true;
  wordParticles.push({
    word: txt,
    x: width / 2,
    y: circleCenterY
  });
  letters = [];
}

// reset everything to circle + input
function resetAll() {
  exploded = false;
  formingCircle = false;
  showInput = false;
  showBackButton = false;
  wordParticles = [];
  if (backButton) backButton.remove();
  resetLetters();
  startFrame = frameCount;
}

function resetLetters() {
  letters = [];
  for (let i = 0; i < 900; i++) {
    letters.push({
      x: random(width),
      y: random(-height * 2, 0),
      char: String.fromCharCode(65 + floor(random(26))),
      speed: random(5, 12),
      targetX: null,
      targetY: null
    });
  }
  circleCenterX = width / 2;
  circleCenterY = height / 2;
}