let letters = [];
let fontSize = 24;
let formingCircle = false;
let circleCenterX, circleCenterY;
let circleRadius = 150; // radius of the final circle

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(fontSize);
  textAlign(CENTER, CENTER);
  fill(255); // white letters
  
  // Generate lots of letters falling
  for (let i = 0; i < 800; i++) {
    letters.push({
      x: random(width),
      y: random(-height, 0),
      char: String.fromCharCode(65 + floor(random(26))),
      speed: random(2, 6),
      targetX: null,
      targetY: null
    });
  }

  circleCenterX = width / 2;
  circleCenterY = height / 2;
}

function draw() {
  background(0); // black background

  // After a while, start forming the circle
  if (frameCount > 600) { // ~10 seconds at 60fps
    formingCircle = true;
  }

  if (!formingCircle) {
    // Falling letters
    for (let l of letters) {
      l.y += l.speed;
      if (l.y > height - fontSize) l.y = height - fontSize; // pile up at bottom
      text(l.char, l.x, l.y);
    }
  } else {
    // Assign target positions in a circle if not already done
    for (let i = 0; i < letters.length; i++) {
      if (letters[i].targetX === null) {
        let angle = random(TWO_PI);
        let r = circleRadius * sqrt(random()); // uniform distribution in circle
        letters[i].targetX = circleCenterX + r * cos(angle);
        letters[i].targetY = circleCenterY + r * sin(angle);
      }
    }

    // Move letters toward their targets
    for (let l of letters) {
      l.x += (l.targetX - l.x) * 0.05;
      l.y += (l.targetY - l.y) * 0.05;
      text(l.char, l.x, l.y);
    }
  }
}