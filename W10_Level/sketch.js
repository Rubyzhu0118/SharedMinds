let images = [];
const total = 6;
let current = 0;

const states = [
  "home",
  "departure",
  "in-between",
  "arrival",
  "adjustment",
  "alone"
];

const subtitles = [
  "warmth, routine, closeness",
  "distance begins to enter",
  "between comfort and dislocation",
  "a room, but not yet a home",
  "the city stays outside the window",
  "living in new york, alone"
];

function preload() {
  images[0] = loadImage("images/000.png");
  images[1] = loadImage("images/001.png");
  images[2] = loadImage("images/002.png");
  images[3] = loadImage("images/003.png");
  images[4] = loadImage("images/004.png");
  images[5] = loadImage("images/005.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  textFont("Georgia");
}

function draw() {
  background(10, 12, 20);

  current = map(mouseX, 0, width, 0, total - 1);
  current = constrain(current, 0, total - 1);

  let i = floor(current);
  let next = min(i + 1, total - 1);
  let t = current - i;

  let w = min(width * 0.58, 900);
  let h = w * 0.75;

  tint(255, 255 * (1 - t));
  image(images[i], width / 2, height / 2 - 10, w, h);

  tint(255, 255 * t);
  image(images[next], width / 2, height / 2 - 10, w, h);

  noTint();

  drawVignette();
  drawHeader();
  drawStatePanel(round(current));
  drawTimeline(round(current));
}

function drawVignette() {
  noStroke();
  fill(0, 110);
  rect(0, 0, width, 110);
  rect(0, height - 120, width, 120);

  fill(0, 40);
  rect(0, 0, 120, height);
  rect(width - 120, 0, 120, height);
}

function drawHeader() {
  textAlign(CENTER, CENTER);

  fill(255, 235);
  textSize(28);
  text("Between Two Rooms", width / 2, 48);

  fill(255, 160);
  textSize(14);
  text("move to drift away from home", width / 2, 76);
}

function drawStatePanel(idx) {
  let panelW = min(360, width * 0.28);
  let panelH = 120;
  let x = width * 0.08;
  let y = height * 0.18;

  noStroke();
  fill(18, 20, 30, 190);
  rect(x, y, panelW, panelH, 16);

  fill(255, 120);
  textAlign(LEFT, TOP);
  textSize(11);
  text("STATE", x + 20, y + 16);

  fill(255, 235);
  textSize(28);
  text(states[idx], x + 20, y + 34);

  fill(230, 230, 235, 180);
  textSize(14);
  text(subtitles[idx], x + 20, y + 76);
}

function drawTimeline(active) {
  let y = height - 58;
  let left = width * 0.2;
  let right = width * 0.8;

  stroke(255, 70);
  strokeWeight(1.2);
  line(left, y, right, y);

  for (let i = 0; i < total; i++) {
    let x = map(i, 0, total - 1, left, right);

    noStroke();
    fill(255, i === active ? 255 : 90);
    ellipse(x, y, i === active ? 14 : 8);

    fill(255, i === active ? 220 : 110);
    textAlign(CENTER, TOP);
    textSize(12);
    text(states[i], x, y + 14);
  }

  fill(255, 150);
  textAlign(LEFT, CENTER);
  textSize(14);
  text("warmth", left - 80, y);

  textAlign(RIGHT, CENTER);
  text("absence", right + 80, y);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}