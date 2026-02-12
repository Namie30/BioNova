// ════════════════════════════════════════════════
//  BioNova Redirect — script.js
// ════════════════════════════════════════════════

const REDIRECT_URL   = 'https://bionovadigesters.com';
const COUNTDOWN_SECS = 20;

// ── Countdown ────────────────────────────────────
const timerEl = document.getElementById('timer');
let secs = COUNTDOWN_SECS;

const tick = setInterval(() => {
  secs--;
  if (timerEl) timerEl.textContent = secs;
  if (secs <= 0) {
    clearInterval(tick);
    window.location.href = REDIRECT_URL;
  }
}, 1000);

// ── Particle System ───────────────────────────────
// Floating glowing orbs that drift upward like fireflies
(function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles;

  const COLORS = [
    'rgba(62,207,106,',
    'rgba(168,230,191,',
    'rgba(45,138,82,',
    'rgba(201,168,76,',   // occasional gold
    'rgba(255,255,255,',
  ];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function randomBetween(a, b) {
    return a + Math.random() * (b - a);
  }

  function createParticle() {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x:    randomBetween(0, W),
      y:    randomBetween(H * 0.2, H * 1.1),    // start below mid
      r:    randomBetween(1, 3.5),
      vx:   randomBetween(-0.25, 0.25),
      vy:   randomBetween(-0.4, -1.0),           // drift upward
      alpha: 0,
      alphaTarget: randomBetween(0.25, 0.75),
      alphaSpeed: randomBetween(0.004, 0.012),
      fadeOut: false,
      color,
      life: 0,
      maxLife: randomBetween(180, 420),          // frames
      glow: randomBetween(4, 14),
    };
  }

  function spawnBurst(n = 60) {
    particles = [];
    for (let i = 0; i < n; i++) {
      const p = createParticle();
      p.life = Math.random() * p.maxLife;        // stagger birth
      particles.push(p);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach((p, i) => {
      // Alpha fade in / out
      if (!p.fadeOut) {
        p.alpha = Math.min(p.alpha + p.alphaSpeed, p.alphaTarget);
      } else {
        p.alpha = Math.max(p.alpha - p.alphaSpeed * 0.7, 0);
      }

      // Life
      p.life++;
      if (p.life > p.maxLife * 0.75) p.fadeOut = true;
      if (p.life > p.maxLife) {
        particles[i] = createParticle(); // respawn
        return;
      }

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Gentle horizontal sway
      p.vx += Math.sin(p.life * 0.04) * 0.008;

      if (p.alpha <= 0) return;

      // Draw glow + core
      ctx.save();
      ctx.globalAlpha = p.alpha;

      // Outer glow
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r + p.glow);
      grad.addColorStop(0,   p.color + '0.9)');
      grad.addColorStop(0.4, p.color + '0.3)');
      grad.addColorStop(1,   p.color + '0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + p.glow, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + '1)';
      ctx.fill();

      ctx.restore();
    });

    requestAnimationFrame(draw);
  }

  resize();
  spawnBurst(70);
  draw();

  window.addEventListener('resize', () => {
    resize();
    spawnBurst(70);
  });
})();