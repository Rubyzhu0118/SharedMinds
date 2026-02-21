// ─── Firebase Config ───────────────────────────────────────────────
console.log("CONNECTED TO FIREBASE");
const firebaseConfig = {
  apiKey: "AIzaSyCuhim68KiNEsM3D4_2h_Tb4-ubcLpFuZQ",
  authDomain: "w5realtime.firebaseapp.com",
  databaseURL: "https://w5realtime-default-rtdb.firebaseio.com",
  projectId: "w5realtime",
  storageBucket: "w5realtime.firebasestorage.app",
  messagingSenderId: "1093720419598",
  appId: "1:1093720419598:web:a3356b855536ec369f3b5f",
  measurementId: "G-1TDD6B34KX"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.database();

// ─── Macaron Palette (6 fixed colors) ──────────────────────────────
const MACARON = [
  "#F7C8E0", // blush pink
  "#C8D8F7", // periwinkle blue
  "#C8F7D8", // mint green
  "#F7E8C8", // peach cream
  "#E8C8F7", // lavender
  "#F7F7C8"  // lemon chiffon
];
const MACARON_SHADOW = [
  "#e8a8c8",
  "#a8bce8",
  "#a8e8c0",
  "#e8c8a0",
  "#c8a8e8",
  "#e0e0a8"
];

// ─── Sticker dimensions ────────────────────────────────────────────
const STICKER_W = 160;
const STICKER_H = 180;
const CORNER_R  = 18;
const IMG_H     = 110;
const UI_OFFSET = 100;

// ─── App State ─────────────────────────────────────────────────────
var worries    = {};
var loadedImgs = {};
var dragging   = null;
var lastClick  = { id: null, time: 0 };

// ─── Proxy endpoint ────────────────────────────────────────────────
const PROXY_URL = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";

// ─── Extract image URL from any proxy response shape ───────────────
function extractURL(data) {
  if (!data) return "";
  if (typeof data === "string" && data.startsWith("http")) return data;
  if (Array.isArray(data)) {
    for (var i = 0; i < data.length; i++) {
      if (typeof data[i] === "string" && data[i].startsWith("http")) return data[i];
    }
  }
  var candidates = ["output", "url", "imageUrl", "imageURL", "image", "result"];
  for (var k = 0; k < candidates.length; k++) {
    var val = data[candidates[k]];
    if (!val) continue;
    if (typeof val === "string" && val.startsWith("http")) return val;
    if (Array.isArray(val) && typeof val[0] === "string" && val[0].startsWith("http")) return val[0];
  }
  return "";
}

// ─── Generate AI image via proxy ───────────────────────────────────
async function generateImage(worryId, worryText) {
  // Build a rich, specific prompt directly from the user's words.
  // Flux-schnell has much better prompt following and no NSFW false-positives
  // for emotional language, so we can use the actual worry text directly.
  var prompt =
    "A cute kawaii pastel cartoon illustration directly visualizing: \"" + worryText + "\". " +
    "Soft pastel colors, children\'s picture book style, flat vector art, " +
    "single centered object or scene, clean white background, " +
    "gentle lighting, simple minimal shapes, no text, no words.";

  try {
    var res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // flux-schnell latest version
        version: "bf53bdb93d739c9c915091cfa5f49ca662d11273a5eb30e7a2ec1939bcf27a00",
        input: {
          prompt: prompt,
          num_outputs: 1,
          num_inference_steps: 4,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 80,
          go_fast: true
        }
      })
    });

    var data = await res.json();
    console.log("[Worries] Proxy response:", JSON.stringify(data));

    var url = extractURL(data);
    console.log("[Worries] Image URL:", url || "(none found)");

    if (url) {
      db.ref("worries/" + worryId).update({ imageURL: url, status: "done" });
    } else {
      console.warn("[Worries] No valid URL in response:", data);
      db.ref("worries/" + worryId).update({ status: "done" });
    }
  } catch (e) {
    console.error("[Worries] generateImage error:", e);
    db.ref("worries/" + worryId).update({ status: "done" });
  }
}

// ─── Firebase real-time listener ───────────────────────────────────
db.ref("worries").on("value", function(snapshot) {
  var data = snapshot.val() || {};
  worries = data;

  for (var id in data) {
    var w = data[id];
    if (w.imageURL && w.imageURL !== "" && !loadedImgs[id]) {
      (function(wid, url) {
        loadImage(
          url,
          function(img) { loadedImgs[wid] = img; },
          function(err) { console.warn("[Worries] loadImage failed for", wid, err); }
        );
      })(id, w.imageURL);
    }
  }

  for (var cid in loadedImgs) {
    if (!data[cid] || !data[cid].imageURL) delete loadedImgs[cid];
  }
});

// ─── Submit a worry ────────────────────────────────────────────────
function submitWorry(text) {
  text = text.trim();
  if (!text) return;

  var colorIndex = Math.floor(Math.random() * MACARON.length);
  var color = MACARON[colorIndex];
  var x = random(40, windowWidth  - STICKER_W - 40);
  var y = random(UI_OFFSET + 20, windowHeight - STICKER_H - 20);

  var ref = db.ref("worries").push({
    text: text,
    x: x,
    y: y,
    color: color,
    imageURL: "",
    status: "generating",
    timestamp: Date.now()
  });

  generateImage(ref.key, text);
}

// ─── p5 Setup ──────────────────────────────────────────────────────
function setup() {
  var cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent("canvas-container");
  cnv.style("position", "absolute");
  cnv.style("top", "0");
  cnv.style("left", "0");
  textFont("Caveat");

  var input = document.getElementById("worryInput");
  var btn   = document.getElementById("sendBtn");

  btn.addEventListener("click", function() {
    submitWorry(input.value);
    input.value = "";
  });
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      submitWorry(input.value);
      input.value = "";
    }
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ─── Draw loop ─────────────────────────────────────────────────────
function draw() {
  clear();
  for (var id in worries) {
    drawSticker(id, worries[id]);
  }
}

// ─── Draw one sticker ──────────────────────────────────────────────
function drawSticker(id, w) {
  var x = (dragging && dragging.id === id) ? mouseX - dragging.offsetX : w.x;
  var y = (dragging && dragging.id === id) ? mouseY - dragging.offsetY : w.y;

  var col = w.color || MACARON[0];
  var colIdx = MACARON.indexOf(col);
  var shadowCol = colIdx >= 0 ? MACARON_SHADOW[colIdx] : "#ccb8d8";

  push();
  translate(x, y);

  // Drop shadow
  drawingContext.shadowOffsetX = 4;
  drawingContext.shadowOffsetY = 6;
  drawingContext.shadowBlur    = 18;
  drawingContext.shadowColor   = shadowCol + "55";

  // Card body
  fill(col);
  noStroke();
  rect(0, 0, STICKER_W, STICKER_H, CORNER_R);

  drawingContext.shadowColor = "transparent";

  // Image area background
  fill(255, 255, 255, 190);
  rect(10, 10, STICKER_W - 20, IMG_H - 10, CORNER_R - 4);

  // Image or placeholder
  if (loadedImgs[id]) {
    drawingContext.save();
    beginClip();
    rect(10, 10, STICKER_W - 20, IMG_H - 10, CORNER_R - 4);
    endClip();
    image(loadedImgs[id], 10, 10, STICKER_W - 20, IMG_H - 10);
    drawingContext.restore();
  } else {
    var dots = ".".repeat((floor(frameCount / 20) % 3) + 1);
    fill(180, 165, 200, 180);
    textAlign(CENTER, CENTER);
    textSize(12);
    textStyle(ITALIC);
    text("Visualizing" + dots, STICKER_W / 2, 10 + (IMG_H - 10) / 2);
    textStyle(NORMAL);
  }

  // Divider
  stroke(255, 255, 255, 120);
  strokeWeight(1);
  line(10, IMG_H + 2, STICKER_W - 10, IMG_H + 2);
  noStroke();

  // Worry text
  fill(80, 60, 100);
  textAlign(CENTER, CENTER);
  textSize(13);
  textLeading(16);
  textWrap(WORD);
  text(w.text || "", 12, IMG_H + 6, STICKER_W - 24, STICKER_H - IMG_H - 10);

  pop();
}

// ─── Drag + double-click to delete ────────────────────────────────
function mousePressed() {
  var ids = Object.keys(worries);
  for (var i = ids.length - 1; i >= 0; i--) {
    var id = ids[i];
    var w  = worries[id];
    if (
      mouseX >= w.x && mouseX <= w.x + STICKER_W &&
      mouseY >= w.y && mouseY <= w.y + STICKER_H
    ) {
      var now = Date.now();
      if (lastClick.id === id && now - lastClick.time < 400) {
        db.ref("worries/" + id).remove();
        delete loadedImgs[id];
        lastClick = { id: null, time: 0 };
        return;
      }
      lastClick = { id: id, time: now };
      dragging  = { id: id, offsetX: mouseX - w.x, offsetY: mouseY - w.y };
      return;
    }
  }
}

function mouseReleased() {
  if (dragging) {
    var id   = dragging.id;
    var newX = mouseX - dragging.offsetX;
    var newY = mouseY - dragging.offsetY;
    db.ref("worries/" + id).update({ x: newX, y: newY });
    dragging = null;
  }
}