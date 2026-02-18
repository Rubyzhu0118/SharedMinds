const CW = 820, CH = 560;
const HALF_W = CW / 2, HALF_H = CH / 2;

const EMOTION_KEYWORDS = {
  joy: [
    'happy','happiness','joy','joyful','excited','amazing','wonderful','love',
    'great','fantastic','beautiful','bright','sunshine','laugh','celebrate',
    'grateful','thankful','blessed','elated','ecstatic','smile','fun','lucky',
    'delight','yay','hooray','radiant','vibrant','cheerful','playful','jubilant'
  ],
  sad: [
    'sad','sadness','cry','crying','lonely','alone','tired','exhausted','miss',
    'missing','lost','grief','grieve','melancholy','hopeless','broken','tears',
    'hurt','pain','ache','empty','numb','depressed','depression','sorrow',
    'gloomy','dark','heavy','down','low','weary','heartbroken','abandon'
  ],
  anger: [
    'angry','anger','furious','rage','hate','frustrated','frustration','mad',
    'annoyed','irritated','upset','scream','explode','boiling','fed up','sick',
    'disgusted','unfair','injustice','resentment','betrayed','bitter','irate',
    'outraged','livid','enraged','hostile','aggressive','violent','resent'
  ],
  calm: [
    'calm','peace','peaceful','serene','serenity','relax','relaxed','quiet',
    'still','gentle','soft','tranquil','meditate','breathe','mindful','rest',
    'restful','soothe','soothing','comfortable','cozy','easy','slow','content',
    'safe','secure','grounded','clear','balanced','harmony','harmonious'
  ],
};

const FAKE_USERS = [
  { emotion: 'joy',   text: 'I just got the job I always wanted!' },
  { emotion: 'joy',   text: 'My dog greeted me like I was gone a year' },
  { emotion: 'joy',   text: 'Today felt like a warm hug from the universe' },
  { emotion: 'joy',   text: 'I laughed until my stomach hurt tonight' },
  { emotion: 'joy',   text: 'Small wins still feel like sunshine' },
  { emotion: 'sad',   text: 'I miss the way things used to be' },
  { emotion: 'sad',   text: 'Nobody texted back today' },
  { emotion: 'sad',   text: 'I am so tired but cannot sleep' },
  { emotion: 'sad',   text: 'Feeling invisible in a crowded room' },
  { emotion: 'sad',   text: 'Some days the weight just will not lift' },
  { emotion: 'anger', text: 'I was talked over in every meeting again' },
  { emotion: 'anger', text: 'It is so unfair and nobody seems to care' },
  { emotion: 'anger', text: 'I am done being the bigger person' },
  { emotion: 'anger', text: 'They took credit for my work. Again.' },
  { emotion: 'anger', text: 'My patience has officially run out' },
  { emotion: 'calm',  text: 'Watching rain on the window, just breathing' },
  { emotion: 'calm',  text: 'Tea, a book, and nowhere to be' },
  { emotion: 'calm',  text: 'The ocean reminded me nothing is permanent' },
  { emotion: 'calm',  text: 'I let it go today and felt lighter' },
  { emotion: 'calm',  text: 'Slow mornings are the best kind' },
];

const QUADRANTS = {
  joy:   { x: 0,      y: 0,      w: HALF_W, h: HALF_H, rgb: [255, 228, 122] },
  sad:   { x: HALF_W, y: 0,      w: HALF_W, h: HALF_H, rgb: [122, 184, 245] },
  anger: { x: 0,      y: HALF_H, w: HALF_W, h: HALF_H, rgb: [255, 140, 107] },
  calm:  { x: HALF_W, y: HALF_H, w: HALF_W, h: HALF_H, rgb: [122, 232, 192] },
};

var canvas, ctx;
var stars = {};
var fakeStars = {};
var userStars = [];
var zoomedEmotion = null;
var zoomProgress = 0;
var zoomDir = 0;
var hoveredStar = null;
var mouseX = 0;
var mouseY = 0;
var canvasRect = null;

window.addEventListener('DOMContentLoaded', function() {
  canvas = document.getElementById('constellationCanvas');
  ctx = canvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  generateBaseStars();
  placeFakeUsers();
  buildStarfieldDOM();
  loop();

  document.getElementById('submitBtn').addEventListener('click', handleSubmit);
  document.getElementById('thoughtInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') handleSubmit();
  });
  document.getElementById('returnBtn').addEventListener('click', zoomOut);

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', function() {
    hoveredStar = null;
    document.getElementById('tooltip').style.display = 'none';
  });
});

function resizeCanvas() {
  var universe = document.getElementById('universe');
  canvas.width  = universe.offsetWidth;
  canvas.height = universe.offsetHeight;
  canvasRect = canvas.getBoundingClientRect();
}

function placeFakeUsers() {
  for (var emotion in QUADRANTS) {
    fakeStars[emotion] = [];
  }
  for (var i = 0; i < FAKE_USERS.length; i++) {
    var user = FAKE_USERS[i];
    var q = QUADRANTS[user.emotion];
    var pos = randomPosInQuadrant(q, fakeStars[user.emotion]);
    var star = {
      x: pos.x,
      y: pos.y,
      r: 2.8,
      twinkleSpeed:  0.6 + Math.random() * 1.2,
      twinkleOffset: Math.random() * Math.PI * 2,
      alpha: 0.7 + Math.random() * 0.25,
      isFake: true,
    };
    fakeStars[user.emotion].push({ star: star, text: user.text, labelAlpha: 0 });
  }
}

function randomPosInQuadrant(q, existing) {
  existing = existing || [];
  var x, y, attempts = 0;
  do {
    var angle  = Math.random() * Math.PI * 2;
    var spread = 18 + Math.random() * (Math.min(q.w, q.h) * 0.36);
    x = (q.x + q.w / 2) + Math.cos(angle) * spread;
    y = (q.y + q.h / 2) + Math.sin(angle) * spread;
    x = Math.max(q.x + 16, Math.min(q.x + q.w - 16, x));
    y = Math.max(q.y + 16, Math.min(q.y + q.h - 16, y));
    attempts++;
    var tooClose = false;
    for (var k = 0; k < existing.length; k++) {
      if (distXY(x, y, existing[k].star.x, existing[k].star.y) < 22) {
        tooClose = true;
        break;
      }
    }
  } while (attempts < 30 && tooClose);
  return { x: x, y: y };
}

function generateBaseStars() {
  for (var emotion in QUADRANTS) {
    var q = QUADRANTS[emotion];
    stars[emotion] = [];
    for (var i = 0; i < 18; i++) {
      var angle  = Math.random() * Math.PI * 2;
      var spread = 15 + Math.random() * (Math.min(q.w, q.h) * 0.4);
      var s = {
        x: Math.max(q.x + 10, Math.min(q.x + q.w - 10, (q.x + q.w / 2) + Math.cos(angle) * spread)),
        y: Math.max(q.y + 10, Math.min(q.y + q.h - 10, (q.y + q.h / 2) + Math.sin(angle) * spread)),
        r: 0.7 + Math.random() * 1.8,
        twinkleSpeed:  0.5 + Math.random() * 1.5,
        twinkleOffset: Math.random() * Math.PI * 2,
        alpha: 0.3 + Math.random() * 0.4,
      };
      stars[emotion].push(s);
    }
  }
}

function allStarsForEmotion(emotion) {
  var base = stars[emotion] || [];
  var fake = (fakeStars[emotion] || []).map(function(fs) { return fs.star; });
  var user = userStars.filter(function(us) { return us.emotion === emotion; }).map(function(us) { return us.star; });
  return base.concat(fake).concat(user);
}

function getConstellationLines(emotion) {
  var pts = allStarsForEmotion(emotion);
  var lines = [];
  var used = {};
  for (var i = 0; i < pts.length; i++) {
    var scored = [];
    for (var j = 0; j < pts.length; j++) {
      if (j !== i) scored.push({ j: j, d: distXY(pts[i].x, pts[i].y, pts[j].x, pts[j].y) });
    }
    scored.sort(function(a, b) { return a.d - b.d; });
    var neighbors = scored.slice(0, 2);
    for (var n = 0; n < neighbors.length; n++) {
      var nb = neighbors[n];
      var lo = Math.min(i, nb.j);
      var hi = Math.max(i, nb.j);
      var key = lo + '-' + hi;
      if (!used[key] && nb.d < 120) {
        used[key] = true;
        lines.push([pts[i], pts[nb.j]]);
      }
    }
  }
  return lines;
}

function distXY(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function detectEmotion(text) {
  var lower = text.toLowerCase();
  var scores = { joy: 0, sad: 0, anger: 0, calm: 0 };
  for (var emotion in EMOTION_KEYWORDS) {
    var keywords = EMOTION_KEYWORDS[emotion];
    for (var k = 0; k < keywords.length; k++) {
      if (lower.indexOf(keywords[k]) !== -1) scores[emotion]++;
    }
  }
  var best = 'sad';
  var bestScore = 0;
  for (var em in scores) {
    if (scores[em] > bestScore) { bestScore = scores[em]; best = em; }
  }
  return best;
}

function handleSubmit() {
  var input = document.getElementById('thoughtInput');
  var text = input.value.trim();
  if (!text) return;

  var emotion = detectEmotion(text);
  var q = QUADRANTS[emotion];
  var existingPts = allStarsForEmotion(emotion).map(function(s) { return { star: s }; });
  var pos = randomPosInQuadrant(q, existingPts);

  var newStar = {
    x: pos.x,
    y: pos.y,
    r: 4,
    twinkleSpeed:  1.2,
    twinkleOffset: Math.random() * Math.PI * 2,
    alpha: 0,
    isUser: true,
  };

  userStars.push({ emotion: emotion, star: newStar, text: text, labelAlpha: 0 });
  input.value = '';
  zoomInto(emotion);
}

function onMouseMove(e) {
  canvasRect = canvas.getBoundingClientRect();
  var scaleX = canvas.width  / canvasRect.width;
  var scaleY = canvas.height / canvasRect.height;
  mouseX = (e.clientX - canvasRect.left) * scaleX;
  mouseY = (e.clientY - canvasRect.top)  * scaleY;

  var logical = screenToLogical(mouseX, mouseY);
  var lx = logical.lx;
  var ly = logical.ly;

  hoveredStar = null;
  var tooltip = document.getElementById('tooltip');

  for (var emotion in fakeStars) {
    var fsList = fakeStars[emotion];
    for (var i = 0; i < fsList.length; i++) {
      var fs = fsList[i];
      if (distXY(lx, ly, fs.star.x, fs.star.y) < fs.star.r * 5 + 10) {
        hoveredStar = fs;
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 14) + 'px';
        tooltip.style.top  = (e.clientY - 10) + 'px';
        tooltip.textContent = '"' + fs.text + '"';
        return;
      }
    }
  }

  for (var u = 0; u < userStars.length; u++) {
    var us = userStars[u];
    if (distXY(lx, ly, us.star.x, us.star.y) < us.star.r * 5 + 10) {
      hoveredStar = us;
      tooltip.style.display = 'block';
      tooltip.style.left = (e.clientX + 14) + 'px';
      tooltip.style.top  = (e.clientY - 10) + 'px';
      tooltip.textContent = '"' + us.text + '"';
      return;
    }
  }

  tooltip.style.display = 'none';
}

function screenToLogical(cx, cy) {
  if (!zoomedEmotion || zoomProgress === 0) {
    return { lx: cx, ly: cy };
  }
  var q  = QUADRANTS[zoomedEmotion];
  var ez = easeInOut(zoomProgress);
  var scale   = 1 + (Math.min(canvas.width / q.w, canvas.height / q.h) - 1) * ez;
  var offsetX = -(q.x + q.w / 2 - canvas.width  / 2) * ez;
  var offsetY = -(q.y + q.h / 2 - canvas.height / 2) * ez;
  var lx = (cx - canvas.width  / 2 - offsetX) / scale + canvas.width  / 2;
  var ly = (cy - canvas.height / 2 - offsetY) / scale + canvas.height / 2;
  return { lx: lx, ly: ly };
}

function zoomInto(emotion) {
  zoomedEmotion = emotion;
  zoomDir = 1;
  document.getElementById('universe').classList.add('zoomed');
  document.getElementById('returnBtn').classList.add('visible');
}

function zoomOut() {
  zoomDir = -1;
  document.getElementById('returnBtn').classList.remove('visible');
  document.getElementById('universe').classList.remove('zoomed');
}

function loop() {
  requestAnimationFrame(loop);
  update();
  render();
}

function update() {
  var speed = 0.022;
  if (zoomDir === 1 && zoomProgress < 1) {
    zoomProgress = Math.min(1, zoomProgress + speed);
  } else if (zoomDir === -1 && zoomProgress > 0) {
    zoomProgress = Math.max(0, zoomProgress - speed);
    if (zoomProgress === 0) { zoomedEmotion = null; zoomDir = 0; }
  }

  for (var i = 0; i < userStars.length; i++) {
    var us = userStars[i];
    if (us.star.alpha < 0.92) us.star.alpha = Math.min(0.92, us.star.alpha + 0.014);
    if (us.labelAlpha < 1)    us.labelAlpha = Math.min(1,    us.labelAlpha + 0.008);
  }

  for (var emotion in fakeStars) {
    var fsList = fakeStars[emotion];
    for (var j = 0; j < fsList.length; j++) {
      var fs = fsList[j];
      var isHov = hoveredStar === fs;
      if (isHov && fs.labelAlpha < 1)       fs.labelAlpha = Math.min(1, fs.labelAlpha + 0.08);
      else if (!isHov && fs.labelAlpha > 0)  fs.labelAlpha = Math.max(0, fs.labelAlpha - 0.08);
    }
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var ez = easeInOut(zoomProgress);

  ctx.save();
  if (zoomedEmotion && ez > 0) {
    var q = QUADRANTS[zoomedEmotion];
    var scale   = 1 + (Math.min(canvas.width / q.w, canvas.height / q.h) - 1) * ez;
    var offsetX = -(q.x + q.w / 2 - canvas.width  / 2) * ez;
    var offsetY = -(q.y + q.h / 2 - canvas.height / 2) * ez;
    ctx.translate(canvas.width  / 2, canvas.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-canvas.width / 2 + offsetX / scale, -canvas.height / 2 + offsetY / scale);
  }

  for (var emotion in QUADRANTS) {
    var isOther = zoomedEmotion && zoomedEmotion !== emotion;
    var alpha   = isOther ? Math.max(0, 1 - ez * 2.5) : 1;
    drawEmotion(emotion, alpha);
  }

  ctx.restore();

  if (ez < 0.5) {
    ctx.save();
    ctx.globalAlpha = (1 - ez * 2) * 0.2;
    ctx.strokeStyle = 'rgba(74,63,107,0.5)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
    ctx.restore();
  }
}

function drawEmotion(emotion, baseAlpha) {
  if (baseAlpha <= 0) return;
  var now  = performance.now() / 1000;
  var q    = QUADRANTS[emotion];
  var rgb  = q.rgb;
  var lines = getConstellationLines(emotion);

  ctx.save();
  ctx.globalAlpha = baseAlpha;

  // nebula glow
  var grd = ctx.createRadialGradient(
    q.x + q.w / 2, q.y + q.h / 2, 0,
    q.x + q.w / 2, q.y + q.h / 2, Math.max(q.w, q.h) * 0.55
  );
  var na = (zoomedEmotion === emotion) ? 0.22 : 0.1;
  grd.addColorStop(0, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + na + ')');
  grd.addColorStop(1, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)');
  ctx.fillStyle = grd;
  ctx.fillRect(q.x, q.y, q.w, q.h);

  // constellation lines
  ctx.strokeStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.22)';
  ctx.lineWidth = 0.6;
  ctx.setLineDash([]);
  for (var l = 0; l < lines.length; l++) {
    ctx.beginPath();
    ctx.moveTo(lines[l][0].x, lines[l][0].y);
    ctx.lineTo(lines[l][1].x, lines[l][1].y);
    ctx.stroke();
  }

  // base decorative stars
  for (var i = 0; i < stars[emotion].length; i++) {
    drawStar(stars[emotion][i], rgb, now, false, false);
  }

  // fake user stars
  var fsList = fakeStars[emotion] || [];
  for (var f = 0; f < fsList.length; f++) {
    var fs = fsList[f];
    var isHov = hoveredStar === fs;
    drawStar(fs.star, rgb, now, false, isHov);
    if (fs.labelAlpha > 0) {
      drawStarLabel(fs.star.x, fs.star.y, fs.text, rgb, fs.labelAlpha, fs.star.r, false);
    }
  }

  // real user stars
  for (var u = 0; u < userStars.length; u++) {
    var us = userStars[u];
    if (us.emotion !== emotion) continue;
    drawStar(us.star, rgb, now, true, false);
    if (us.labelAlpha > 0) {
      drawStarLabel(us.star.x, us.star.y, us.text, rgb, us.labelAlpha, us.star.r, true);
    }
  }

  ctx.restore();
}

function drawStar(s, rgb, now, isUser, isHovered) {
  var tw    = Math.sin(now * s.twinkleSpeed + s.twinkleOffset) * 0.2 + 0.8;
  var alpha = Math.min(1, s.alpha) * tw;
  var r     = s.r * (isHovered ? 1.6 : 1);

  var sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 5);
  sg.addColorStop(0, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + (alpha * 0.55) + ')');
  sg.addColorStop(1, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.arc(s.x, s.y, r * 5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
  ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();

  if (isUser || isHovered) {
    ctx.strokeStyle = 'rgba(255,255,255,' + (alpha * 0.85) + ')';
    ctx.lineWidth = isUser ? 0.8 : 0.6;
    ctx.beginPath();
    ctx.moveTo(s.x - r * 3, s.y); ctx.lineTo(s.x + r * 3, s.y);
    ctx.moveTo(s.x, s.y - r * 3); ctx.lineTo(s.x, s.y + r * 3);
    ctx.stroke();
  }
}

function drawStarLabel(sx, sy, text, rgb, alpha, starR, isUser) {
  var label    = text.length > 32 ? text.slice(0, 30) + '…' : text;
  var fontSize = isUser ? 11 : 10;
  var weight   = isUser ? '400' : '300';
  ctx.font = weight + ' ' + fontSize + 'px Jost, sans-serif';

  var tw   = ctx.measureText(label).width;
  var padX = 9;
  var padY = 5;
  var boxW = tw + padX * 2;
  var boxH = fontSize + padY * 2;
  var bx   = sx - boxW / 2;
  var by   = sy - starR * 4 - boxH - 6;

  ctx.save();
  ctx.globalAlpha *= alpha;

  // solid pill background
  if (isUser) {
    ctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.92)';
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
  }
  roundRect(ctx, bx, by, boxW, boxH, 6);
  ctx.fill();

  // border
  ctx.strokeStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.6)';
  ctx.lineWidth = 1;
  roundRect(ctx, bx, by, boxW, boxH, 6);
  ctx.stroke();

  // text
  ctx.fillStyle = 'rgba(30,20,55,0.95)';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, sx, by + boxH / 2);

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function buildStarfieldDOM() {
  var sf = document.getElementById('starfield');
  for (var i = 0; i < 55; i++) {
    var s = document.createElement('div');
    s.className = 'star';
    var size = 1 + Math.random() * 2.2;
    s.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (Math.random()*100) + '%;top:-' + size + 'px;animation-duration:' + (8+Math.random()*14) + 's;animation-delay:' + (Math.random()*10) + 's;';
    sf.appendChild(s);
  }
  var chars = ['✦','✧','✸','✺','✼'];
  for (var j = 0; j < 16; j++) {
    var sp = document.createElement('div');
    sp.className = 'sparkle';
    sp.textContent = chars[Math.floor(Math.random()*chars.length)];
    sp.style.cssText = 'left:' + (Math.random()*100) + '%;top:' + (Math.random()*100) + '%;animation-duration:' + (2+Math.random()*4) + 's;animation-delay:' + (Math.random()*4) + 's;font-size:' + (10+Math.random()*13) + 'px;';
    sf.appendChild(sp);
  }
}