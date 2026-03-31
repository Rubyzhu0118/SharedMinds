/* ═══════════════════════════════════════════════════════════
   CHOREOGRAPHING THE COSMOS
   p5.js + MediaPipe Hands — Full Cosmic Particle Experience
   ═══════════════════════════════════════════════════════════ */

"use strict";

/* ─── LANDING PAGE PARTICLE BACKGROUND ─── */
(function landingBackground() {
  const canvas = document.getElementById('landing-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, pts = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 280; i++) {
    pts.push({
      x: Math.random() * 2000 - 1000,
      y: Math.random() * 2000 - 1000,
      z: Math.random() * 2000,
      s: Math.random() * 0.9 + 0.2,
      b: Math.random()
    });
  }

  let t = 0;
  function drawLanding() {
    if (!document.getElementById('landing') || document.getElementById('landing').classList.contains('fade-out')) return;
    ctx.fillStyle = 'rgba(0,0,5,0.25)';
    ctx.fillRect(0, 0, W, H);
    t += 0.0015;
    pts.forEach(p => {
      p.z -= 1.2;
      if (p.z <= 0) p.z = 2000;
      const sx = (p.x / p.z) * W + W / 2;
      const sy = (p.y / p.z) * H + H / 2;
      const size = ((1 - p.z / 2000) * 1.6 * p.s);
      const bright = (1 - p.z / 2000) * 0.65;
      const pulse = Math.sin(t * 2 + p.b * 10) * 0.2 + 0.8;
      if (sx < 0 || sx > W || sy < 0 || sy > H) return;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      const hue = 210 + p.b * 40;
      ctx.fillStyle = `hsla(${hue}, 60%, ${55 + p.b * 30}%, ${bright * pulse})`;
      ctx.fill();

      if (size > 1.0 && p.b > 0.7) {
        ctx.shadowBlur = 5;
        ctx.shadowColor = `hsla(${hue}, 80%, 80%, 0.3)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
    requestAnimationFrame(drawLanding);
  }
  drawLanding();
})();

/* ─── ENTER TRANSITION ─── */
window.enterExperience = function() {
  const landing = document.getElementById('landing');
  const main    = document.getElementById('main-experience');
  landing.classList.add('fade-out');
  setTimeout(() => {
    main.classList.remove('hidden');
    startMainExperience();
  }, 1200);
};

/* ═══════════════════════════════════════════════════════════
   MAIN EXPERIENCE
   ═══════════════════════════════════════════════════════════ */
function startMainExperience() {

  /* ─── GUIDANCE SYSTEM ─── */
  const guidanceSequence = [
    "Enter with a closed fist.",
    "Hold the fist inside the frame.",
    "Now open your hand.",
    "Stay still. Let the world settle.",
    "Sweep across the dark.",
    "Draw a clear circle in the air.",
    "Disturb the pattern.",
    "Bring your second hand into view.",
    "You are the cosmos, remembering itself."
  ];

  const discoveryMessages = {
    open:    "You discovered order.",
    fist:    "You invoked gravity.",
    swipe:   "You opened the current.",
    circle:  "You formed orbit.",
    tremble: "You introduced uncertainty.",
    two:     "You revealed symmetry."
  };

  let guidanceIndex = 0;
  let discoveredGestures = new Set();
  let guidanceTimer = null;

  function showGuidance(text) {
    const el = document.getElementById('guidance-text');
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = text;
      el.style.opacity = '1';
    }, 500);
  }

  function advanceGuidance() {
    if (guidanceIndex < guidanceSequence.length) {
      showGuidance(guidanceSequence[guidanceIndex++]);
      clearTimeout(guidanceTimer);
      guidanceTimer = setTimeout(advanceGuidance, 6000);
    }
  }

  function showDiscovery(gesture) {
    if (discoveredGestures.has(gesture)) return;
    discoveredGestures.add(gesture);
    const el = document.getElementById('discovery-text');
    const msg = discoveryMessages[gesture];
    if (!msg) return;
    el.textContent = msg;
    el.classList.remove('visible');
    void el.offsetWidth;
    el.classList.add('visible');
    document.querySelector(`[data-gesture="${gesture}"]`)?.classList.add('active');
    setTimeout(() => el.classList.remove('visible'), 3000);
    advanceGuidance();
  }

  advanceGuidance();

  /* ─── HAND STATE ─── */
  const handState = {
    hands: [],
    gesture: 'none',
    velocity: { x: 0, y: 0 },
    smoothedVelocity: { x: 0, y: 0 },
    prevPos: null,
    circleHistory: [],
    trembleHistory: [],
    handCount: 0,
    fistHeldFrames: 0,
    openStillFrames: 0
  };

  /* ─── WEBCAM + MEDIAPIPE ─── */
  const video = document.getElementById('webcam-video');
  const overlayCanvas = document.getElementById('hand-overlay');
  const overlayCtx = overlayCanvas.getContext('2d');

  navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false })
    .then(stream => {
      video.srcObject = stream;
      video.play();
      initMediaPipe();
    })
    .catch(err => {
      console.warn('Webcam unavailable, running in demo mode:', err);
      runDemoMode();
    });

  function initMediaPipe() {
    const hands = new Hands({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onHandResults);

    const camera = new Camera(video, {
      onFrame: async () => { await hands.send({ image: video }); },
      width: 640, height: 480
    });
    camera.start();
  }

  function onHandResults(results) {
    overlayCanvas.width  = overlayCanvas.offsetWidth;
    overlayCanvas.height = overlayCanvas.offsetHeight;
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    handState.hands = results.multiHandLandmarks || [];
    handState.handCount = handState.hands.length;

    if (handState.handCount === 0) {
      handState.gesture = 'none';
      document.getElementById('gesture-indicator').textContent = '—';
      return;
    }

    handState.hands.forEach(landmarks => {
      drawHandOverlay(landmarks);
      analyzeGesture(landmarks);
    });

    if (handState.handCount === 2) {
      handState.gesture = 'two';
      document.getElementById('gesture-indicator').textContent = 'SYMMETRY';
      showDiscovery('two');
    }
  }

  function drawHandOverlay(landmarks) {
    const W = overlayCanvas.width;
    const H = overlayCanvas.height;

    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],[0,17]
    ];

    overlayCtx.strokeStyle = 'rgba(100,200,255,0.5)';
    overlayCtx.lineWidth = 1;
    connections.forEach(([a, b]) => {
      overlayCtx.beginPath();
      overlayCtx.moveTo(landmarks[a].x * W, landmarks[a].y * H);
      overlayCtx.lineTo(landmarks[b].x * W, landmarks[b].y * H);
      overlayCtx.stroke();
    });

    landmarks.forEach((lm, i) => {
      overlayCtx.beginPath();
      overlayCtx.arc(lm.x * W, lm.y * H, i === 0 ? 4 : 2, 0, Math.PI * 2);
      overlayCtx.fillStyle = i === 0 ? 'rgba(255,200,100,0.8)' : 'rgba(100,220,255,0.8)';
      overlayCtx.fill();
    });
  }

  function analyzeGesture(landmarks) {
    const fingers = [
      landmarks[8].y  < landmarks[6].y,
      landmarks[12].y < landmarks[10].y,
      landmarks[16].y < landmarks[14].y,
      landmarks[20].y < landmarks[18].y
    ];

    const thumbOpen = landmarks[4].x < landmarks[3].x;
    const extendedCount = fingers.filter(Boolean).length + (thumbOpen ? 1 : 0);

    const cx = (landmarks[0].x + landmarks[9].x) / 2;
    const cy = (landmarks[0].y + landmarks[9].y) / 2;

    if (handState.prevPos) {
      const rawVX = (cx - handState.prevPos.x) * 50;
      const rawVY = (cy - handState.prevPos.y) * 50;

      handState.velocity.x = rawVX;
      handState.velocity.y = rawVY;
      handState.smoothedVelocity.x = handState.smoothedVelocity.x * 0.82 + rawVX * 0.18;
      handState.smoothedVelocity.y = handState.smoothedVelocity.y * 0.82 + rawVY * 0.18;
    }

    handState.prevPos = { x: cx, y: cy };

    const vx = handState.smoothedVelocity.x;
    const vy = handState.smoothedVelocity.y;
    const speed = Math.sqrt(vx * vx + vy * vy);

    handState.circleHistory.push({ x: cx, y: cy });
    if (handState.circleHistory.length > 48) handState.circleHistory.shift();

    handState.trembleHistory.push(speed);
    if (handState.trembleHistory.length > 20) handState.trembleHistory.shift();

    const avgSpeed = handState.trembleHistory.reduce((a, b) => a + b, 0) / handState.trembleHistory.length;
    const speedVariance = handState.trembleHistory.reduce((a, s) => a + Math.abs(s - avgSpeed), 0) / handState.trembleHistory.length;

    let gesture = 'none';

    if (handState.handCount === 2) {
      gesture = 'two';
      handState.fistHeldFrames = 0;
      handState.openStillFrames = 0;

    } else if (extendedCount <= 1) {
      handState.fistHeldFrames++;
      handState.openStillFrames = 0;
      gesture = 'fist';
      showDiscovery('fist');

    } else if (extendedCount >= 4) {
      const circularConfidence = getCircularConfidence(handState.circleHistory);

      const isStillOpen = speed < 0.035;
      const isSwipe = speed > 0.11;
      const isOrbit = speed > 0.06 && circularConfidence > 0.72;

      if (isStillOpen) {
        handState.openStillFrames++;
      } else {
        handState.openStillFrames = 0;
      }

      handState.fistHeldFrames = 0;

      if (isOrbit) {
        gesture = 'circle';
        showDiscovery('circle');
      } else if (isSwipe) {
        gesture = 'swipe';
        showDiscovery('swipe');
      } else if (speedVariance > 0.02 && speed > 0.03) {
        gesture = 'tremble';
        showDiscovery('tremble');
      } else {
        gesture = 'open';
        showDiscovery('open');
      }

    } else {
      gesture = 'partial';
      handState.fistHeldFrames = 0;
      handState.openStillFrames = 0;
    }

    handState.gesture = gesture;

    const labels = {
      fist: 'GRAVITY',
      open: 'ORDER',
      swipe: 'FLOW',
      circle: 'ORBIT',
      tremble: 'UNCERTAINTY',
      two: 'SYMMETRY',
      partial: 'sensing...',
      none: '—'
    };

    document.getElementById('gesture-indicator').textContent = labels[gesture] || '—';
  }

  function getCircularConfidence(history) {
    if (history.length < 36) return 0;

    const cx = history.reduce((s, p) => s + p.x, 0) / history.length;
    const cy = history.reduce((s, p) => s + p.y, 0) / history.length;

    const radii = history.map(p => Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2));
    const avgR = radii.reduce((a, b) => a + b, 0) / radii.length;
    if (avgR < 0.045) return 0;

    const variance = radii.reduce((a, r) => a + Math.abs(r - avgR), 0) / radii.length;
    const radiusScore = 1 - Math.min(1, variance / (avgR * 0.55));

    let angleTravel = 0;
    for (let i = 1; i < history.length; i++) {
      const a1 = Math.atan2(history[i - 1].y - cy, history[i - 1].x - cx);
      const a2 = Math.atan2(history[i].y - cy, history[i].x - cx);
      let d = a2 - a1;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      angleTravel += Math.abs(d);
    }

    const travelScore = Math.min(1, angleTravel / (Math.PI * 1.45));

    return radiusScore * 0.45 + travelScore * 0.55;
  }

  /* ─── DEMO MODE (no webcam) ─── */
  function runDemoMode() {
    const demoGestures = ['open','fist','swipe','circle','tremble'];
    let gi = 0;
    setInterval(() => {
      gi = (gi + 1) % demoGestures.length;
      handState.gesture = demoGestures[gi];
      const angle = Math.random() * Math.PI * 2;
      handState.velocity.x = Math.cos(angle) * 0.05;
      handState.velocity.y = Math.sin(angle) * 0.05;
    }, 4000);
  }

  /* ═══════════════════════════════════════════════════════════
     P5.JS SKETCH
     ═══════════════════════════════════════════════════════════ */
  new p5(function(p) {

    const NUM_PARTICLES  = 2800;
    const NUM_STARS      = 60;
    const FLOW_SCALE     = 0.003;
    const TRAIL_ALPHA    = 24;

    let particles = [];
    let stars     = [];
    let noiseOff  = 0;
    let orbitAngle = 0;
    let symmetryActive = false;

    class Particle {
      constructor(isStarType) {
        this.isStar = isStarType || false;
        this.reset();
      }

      reset() {
        const angle  = p.random(p.TWO_PI);
        const radius = p.pow(p.random(), 0.65) * p.width * 0.35;
        const spiralOffset = angle + radius * 0.004;

        this.x    = p.width / 2  + Math.cos(spiralOffset) * radius;
        this.y    = p.height / 2 + Math.sin(spiralOffset) * radius * 0.42;
        this.px   = this.x;
        this.py   = this.y;
        this.vx   = p.random(-0.18, 0.18);
        this.vy   = p.random(-0.09, 0.09);
        this.ax   = 0;
        this.ay   = 0;
        this.life = p.random(0.5, 1.0);
        this.maxLife = this.life;

        if (this.isStar) {
          this.size       = p.random(1.8, 3.8);
          this.brightness = p.random(180, 255);
          this.hue        = p.random([190, 205, 220, 245, 280, 320, 35, 55]);
          this.speed      = p.random(0.2, 0.55);
        } else {
          this.size       = p.random(0.8, 2.0);
          this.brightness = p.random(70, 170);
          this.hue        = p.random([185, 200, 215, 230, 250, 275, 300, 35]);
          this.speed      = p.random(0.25, 1.0);
        }

        this.twinkle = p.random(1000);
      }

      update(gesture, vx, vy, handCount) {
        const cx = p.width / 2;
        const cy = p.height / 2;

        const n = p.noise(this.x * FLOW_SCALE, this.y * FLOW_SCALE, noiseOff);
        const flowAngle = n * p.TWO_PI * 4;
        this.ax = Math.cos(flowAngle) * 0.022;
        this.ay = Math.sin(flowAngle) * 0.022;

        if (gesture === 'open') {
          this.vx *= 0.94;
          this.vy *= 0.94;
          const gx = Math.round(this.x / 50) * 50;
          const gy = Math.round(this.y / 50) * 50;
          this.ax += (gx - this.x) * 0.0015;
          this.ay += (gy - this.y) * 0.0015;

        } else if (gesture === 'fist') {
          const dx = cx - this.x;
          const dy = cy - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          const force = 6 / dist;
          this.ax += dx * force * 0.004;
          this.ay += dy * force * 0.004;
          this.vx *= 0.982;
          this.vy *= 0.982;

        } else if (gesture === 'swipe') {
          this.ax += vx * 0.065;
          this.ay += vy * 0.065;
          this.vx *= 0.988;
          this.vy *= 0.988;

        } else if (gesture === 'circle') {
          const dx = this.x - cx;
          const dy = this.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          this.ax += -dy / dist * 0.62;
          this.ay +=  dx / dist * 0.62;
          const targetR = p.width * 0.28;
          this.ax += (targetR - dist) / targetR * 0.14 * dx / dist;
          this.ay += (targetR - dist) / targetR * 0.14 * dy / dist;
          this.vx *= 0.991;
          this.vy *= 0.991;

        } else if (gesture === 'tremble') {
          this.ax += p.random(-0.7, 0.7);
          this.ay += p.random(-0.7, 0.7);
          this.vx *= 0.93;
          this.vy *= 0.93;

        } else if (gesture === 'two' || handCount === 2) {
          const mirrorX = p.width - this.x;
          this.ax += (mirrorX - this.x) * 0.0008;
          this.vy *= 0.975;
        } else {
          const dx = this.x - cx;
          const dy = this.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          this.ax += -dy / dist * 0.12;
          this.ay +=  dx / dist * 0.12;
          this.ax -= dx * 0.00008;
          this.ay -= dy * 0.00008;
          this.vx *= 0.997;
          this.vy *= 0.997;
        }

        this.vx += this.ax;
        this.vy += this.ay;

        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (spd > 3.5 * this.speed) {
          this.vx = (this.vx / spd) * 3.5 * this.speed;
          this.vy = (this.vy / spd) * 3.5 * this.speed;
        }

        this.px = this.x;
        this.py = this.y;
        this.x += this.vx;
        this.y += this.vy;

        const margin = 80;
        if (this.x < -margin) this.x = p.width + margin;
        if (this.x >  p.width + margin) this.x = -margin;
        if (this.y < -margin) this.y = p.height + margin;
        if (this.y >  p.height + margin) this.y = -margin;
      }

      draw() {
        const twinkleAlpha = this.isStar
          ? (Math.sin(p.frameCount * 0.04 + this.twinkle) * 0.25 + 0.75)
          : 1;

        const alpha = Math.min(255, this.brightness * twinkleAlpha);
        const hue = this.hue;
        const sat = this.isStar ? 55 : 78;
        const lit = this.isStar ? 98 : 88;

        p.stroke(hue, sat, lit, alpha * 0.28);
        p.strokeWeight(this.size * 0.48);
        p.line(this.px, this.py, this.x, this.y);

        p.noStroke();
        p.fill(hue, sat, lit, alpha);
        p.ellipse(this.x, this.y, this.size, this.size);

        if (this.isStar) {
          p.fill(hue, 50, 100, alpha * 0.16);
          p.ellipse(this.x, this.y, this.size * 4.8, this.size * 4.8);
        } else {
          p.fill(hue, 55, 96, alpha * 0.07);
          p.ellipse(this.x, this.y, this.size * 2.2, this.size * 2.2);
        }
      }
    }

    p.setup = function() {
      const cnv = p.createCanvas(window.innerWidth, window.innerHeight);
      cnv.parent('canvas-container');
      p.colorMode(p.HSB, 360, 100, 100, 255);
      p.blendMode(p.ADD);

      for (let i = 0; i < NUM_PARTICLES; i++) {
        particles.push(new Particle(false));
      }
      for (let i = 0; i < NUM_STARS; i++) {
        stars.push(new Particle(true));
      }

      p.noStroke();
    };

    p.windowResized = function() {
      p.resizeCanvas(window.innerWidth, window.innerHeight);
    };

    p.draw = function() {
      p.blendMode(p.BLEND);
      p.fill(0, 0, 0, TRAIL_ALPHA);
      p.noStroke();
      p.rect(0, 0, p.width, p.height);
      p.blendMode(p.ADD);

      noiseOff += 0.0012;
      orbitAngle += 0.005;

      const gesture   = handState.gesture;
      const velX      = handState.smoothedVelocity.x;
      const velY      = handState.smoothedVelocity.y;
      const handCount = handState.handCount;

      for (let i = 0; i < particles.length; i++) {
        particles[i].update(gesture, velX, velY, handCount);
        particles[i].draw();
      }
      for (let i = 0; i < stars.length; i++) {
        stars[i].update(gesture, velX, velY, handCount);
        stars[i].draw();
      }

      p.blendMode(p.BLEND);
      p.noStroke();

      const vg = p.drawingContext;
      const vGrad = vg.createRadialGradient(
        p.width/2, p.height/2, p.height * 0.22,
        p.width/2, p.height/2, p.height * 0.78
      );
      vGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vGrad.addColorStop(1, 'rgba(0,0,5,0.72)');
      vg.fillStyle = vGrad;
      vg.fillRect(0, 0, p.width, p.height);

      const bGrad = vg.createLinearGradient(0, p.height * 0.72, 0, p.height);
      bGrad.addColorStop(0, 'rgba(0,0,5,0)');
      bGrad.addColorStop(1, 'rgba(0,0,8,0.78)');
      vg.fillStyle = bGrad;
      vg.fillRect(0, p.height * 0.72, p.width, p.height * 0.28);

      p.blendMode(p.ADD);

      drawNebula(gesture);
    };

    function drawNebula(gesture) {
      const cx = p.width / 2;
      const cy = p.height / 2;

      if (gesture === 'fist') {
        for (let r = 40; r > 0; r -= 6) {
          const a = p.map(r, 0, 40, 45, 0);
          p.fill(210, 60, 95, a);
          p.ellipse(cx, cy, r * 2, r * 1.1);
        }
        p.fill(0, 0, 100, 22);
        p.ellipse(cx, cy, 7, 7);
      } else if (gesture === 'circle') {
        p.noFill();
        const r = p.width * 0.26;
        p.stroke(215, 60, 90, 14);
        p.strokeWeight(1);
        p.ellipse(cx, cy, r * 2, r * 0.88);
        p.noStroke();
      }
    }

  }); // end p5 sketch

} // end startMainExperience