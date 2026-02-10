let inputBox, button;
let emotionSlider;
let speechText = "";
let generatedImages = [null, null, null, null, null]; // calm->0, uneasy->1 ... overwhelmed->4
let generating = false;
let fadeIns = [0, 0, 0, 0, 0];

let stars = [];
let constellationPoints = [];
const emotions = ["calm", "uneasy", "tense", "anxious", "overwhelmed"];

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("monospace");

  // Input box
  inputBox = createInput("Type your prompt here...");
  inputBox.size(400);
  inputBox.position(width / 2 - 220, height - 90);
  styleInput(inputBox);

  // Button
  button = createButton("Chat");
  button.position(width / 2 + 230, height - 90); // 按钮右移，避免和输入框重叠
  styleButton(button);
  button.mousePressed(generateFromInput);

  // Slider
  emotionSlider = createSlider(0, emotions.length - 1, 0, 1);
  emotionSlider.style("width", "60%");
  emotionSlider.style("accent-color", "#777");
  emotionSlider.position(width * 0.2, height - 50);

  // Stars
  for (let i = 0; i < 200; i++) stars.push(new Star());
  for (let i = 0; i < 30; i++) constellationPoints.push(createVector(random(width), random(height - 150)));
}

function draw() {
  drawStarBackground();
  drawGeneratedImages();
  drawBottomPanel();
}

function drawStarBackground() {
  background(6, 8, 14);

  for (let s of stars) {
    s.update();
    s.display();
  }

  stroke(130, 160, 220, 35);
  strokeWeight(1);
  for (let i = 0; i < constellationPoints.length; i++) {
    let a = constellationPoints[i];
    let b = constellationPoints[(i + 1) % constellationPoints.length];
    if (dist(a.x, a.y, b.x, b.y) < 180) line(a.x, a.y, b.x, b.y);
    a.x += sin(frameCount * 0.0005 + i) * 0.15;
    a.y += cos(frameCount * 0.0005 + i) * 0.15;
  }
}

function drawGeneratedImages() {
  let spacing = width / 6;
  for (let i = 0; i < emotions.length; i++) {
    let img = generatedImages[i];
    if (img) {
      fadeIns[i] = lerp(fadeIns[i], 255, 0.04);
      tint(255, fadeIns[i]);

      // Calm在最左边 -> emotions[0], Overwhelmed在最右边 -> emotions[4]
      let xPos = spacing * (i + 1); 
      let imgH = height * 0.35;
      let imgW = (img.width / img.height) * imgH;
      imageMode(CENTER);
      image(img, xPos, height / 2 - 50, imgW, imgH);
      noTint();

      // Label
      fill(220);
      textSize(14);
      textAlign(CENTER);
      text(emotions[i], xPos, height / 2 - 50 + imgH / 2 + 16);
    }
  }
}

function drawBottomPanel() {
  let panelH = 130; // 增加高度，给文字留空间
  noStroke();
  fill(8, 10, 18, 235);
  rect(0, height - panelH, width, panelH);

  fill(200);
  textSize(12);
  textAlign(CENTER);
  text("Emotional Steering", width / 2, height - panelH + 30);

  fill(120);
  textSize(11);
  textAlign(LEFT);
  text("Calm", width * 0.15, height - 60);
  textAlign(RIGHT);
  text("Overwhelmed", width * 0.85, height - 60);

  // 情绪状态显示下移
  textAlign(CENTER);
  fill(180);
  text(emotions[emotionSlider.value()], width / 2, height - 20);

  if (generating) {
    fill(200, 200, 0);
    textSize(14);
    text("Generating image...", width / 2, 20);
  }
}

function generateFromInput() {
  let prompt = inputBox.value();
  let emotionIndex = emotionSlider.value();
  if (prompt.length > 0 && !generating) {
    generating = true;
    fadeIns[emotionIndex] = 0;
    generateImage(prompt, emotionIndex);
  }
}

async function generateImage(prompt, emotionIndex) {
  try {
    const res = await fetch("https://itp-ima-replicate-proxy.web.app/api/create_n_get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "black-forest-labs/flux-2-pro",
        input: { prompt: `${prompt}, ${emotions[emotionIndex]}, cinematic, moody, night, soft grain` }
      })
    });
    const data = await res.json();
    console.log("Proxy Response:", data);

    if (data.output) {
      loadImage(data.output, img => {
        generatedImages[emotionIndex] = img;
        generating = false;
      });
    } else if (data.status && data.status === "processing") {
      setTimeout(() => generateImage(prompt, emotionIndex), 2000);
    } else {
      console.error("Unexpected response from proxy:", data);
      generating = false;
    }
  } catch (err) {
    console.error("Error fetching image:", err);
    generating = false;
  }
}

// ---------------- UI STYLING ----------------
function styleInput(el) {
  el.style("background", "rgba(18,22,32,0.95)");
  el.style("color", "#eaeaea");
  el.style("border", "1px solid #444");
  el.style("border-radius", "18px");
  el.style("padding", "12px 18px");
  el.style("font-family", "monospace");
  el.style("font-size", "14px");
  el.style("outline", "none");
}

function styleButton(btn) {
  btn.style("background", "rgba(255,255,255,0.06)");
  btn.style("color", "#eee");
  btn.style("border", "1px solid #555");
  btn.style("border-radius", "18px");
  btn.style("padding", "12px 22px");
  btn.style("font-family", "monospace");
  btn.style("cursor", "pointer");
}

// ---------------- STAR CLASS ----------------
class Star {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.r = random(0.6, 1.8);
    this.speed = random(0.05, 0.2);
  }

  update() {
    this.y += this.speed;
    if (this.y > height) {
      this.y = 0;
      this.x = random(width);
    }
  }

  display() {
    noStroke();
    fill(200, 220, 255, 120);
    ellipse(this.x, this.y, this.r);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  inputBox.position(width / 2 - 220, height - 80);
  button.position(width / 2 + 230, height - 80);
  emotionSlider.position(width * 0.2, height - 50);
}
