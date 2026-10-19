/**
 * ============================================================================
 * ATELIER FORMA — Kinetic Physics & Ribbon Simulation Canvas
 * Implements Verlet Integration, Multi-Node Elastic Ribbons & Ambient Dynamics
 * ============================================================================
 */

class BackgroundAmbientSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numParticles = 40;
    this.mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
    this.width = 0;
    this.height = 0;

    this.init();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  init() {
    this.resize();
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.35 + 0.15,
        baseAlpha: Math.random() * 0.35 + 0.15
      });
    }
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
    });
  }

  animate() {
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    this.ctx.clearRect(0, 0, this.width, this.height);

    const isDark = document.body.getAttribute('data-theme') === 'obsidian';
    const color = isDark ? '255, 255, 255' : '40, 38, 35';

    // Update and draw particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Subtle mouse interaction
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 150) {
        const force = (1 - dist / 150) * 0.8;
        p.x -= (dx / dist) * force;
        p.y -= (dy / dist) * force;
      }

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
      this.ctx.fill();

      // Delicate connecting lines
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const d = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (d < 120) {
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(${color}, ${(1 - d / 120) * 0.07})`;
          this.ctx.lineWidth = 0.75;
          this.ctx.stroke();
        }
      }
    }

    requestAnimationFrame(this.animate);
  }
}

/**
 * Interactive Physics Ribbon & Porcelain Pearl Sandbox
 */
class KineticSandbox {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = 0;
    this.height = 0;

    // Simulation Entities
    this.ribbons = [];
    this.pearls = [];
    this.gravity = 0.25;
    this.wind = 0;
    this.mouse = {
      x: 0,
      y: 0,
      px: 0,
      py: 0,
      down: false,
      speed: 0
    };

    this.init();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  init() {
    this.resize();
    this.createRibbons();
    this.spawnInitialPearls();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  createRibbons() {
    this.ribbons = [];
    const ribbonCount = 5;
    const pointsPerRibbon = 24;

    for (let r = 0; r < ribbonCount; r++) {
      const points = [];
      const startX = (this.width / (ribbonCount + 1)) * (r + 1);

      for (let i = 0; i < pointsPerRibbon; i++) {
        points.push({
          x: startX,
          y: (i / pointsPerRibbon) * (this.height * 0.8) + 40,
          oldX: startX,
          oldY: (i / pointsPerRibbon) * (this.height * 0.8) + 40,
          pinned: i === 0 // Top point is pinned
        });
      }

      this.ribbons.push({
        points,
        length: (this.height * 0.75) / pointsPerRibbon,
        width: 14 - r * 1.5,
        hueShift: r * 8
      });
    }
  }

  spawnInitialPearls() {
    this.pearls = [];
    for (let i = 0; i < 8; i++) {
      this.spawnPearl(
        Math.random() * (this.width - 100) + 50,
        Math.random() * (this.height * 0.5) + 30
      );
    }
  }

  spawnPearl(x, y) {
    this.pearls.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 4,
      radius: Math.random() * 10 + 10,
      mass: Math.random() * 0.5 + 1,
      color: '#ffffff'
    });
    if (this.pearls.length > 30) {
      this.pearls.shift();
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createRibbons();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      this.mouse.speed = Math.hypot(newX - this.mouse.x, newY - this.mouse.y);
      this.mouse.px = this.mouse.x;
      this.mouse.py = this.mouse.y;
      this.mouse.x = newX;
      this.mouse.y = newY;

      // Audio feedback on swift gestures
      if (this.mouse.speed > 35 && window.soundEngine) {
        window.soundEngine.playRipple(this.mouse.speed);
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.mouse.down = true;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.spawnPearl(x, y);

      if (window.soundEngine) {
        window.soundEngine.playTap(640);
      }
    });

    window.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });

    // Touch support for mobile/tablet
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.touches[0].clientX - rect.left;
        this.mouse.y = e.touches[0].clientY - rect.top;
      }
    }, { passive: true });
  }

  updateVerlet() {
    const iterations = 5;

    // 1. Verlet integration for ribbons
    this.ribbons.forEach((ribbon) => {
      const points = ribbon.points;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.pinned) continue;

        const vx = (p.x - p.oldX) * 0.98;
        const vy = (p.y - p.oldY) * 0.98;

        p.oldX = p.x;
        p.oldY = p.y;

        p.x += vx + this.wind;
        p.y += vy + this.gravity;

        // Interaction with mouse
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 80) {
          const push = (1 - dist / 80) * 8;
          p.x += (dx / dist) * push;
          p.y += (dy / dist) * push;
        }
      }

      // Constraints relaxation
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const distance = Math.hypot(dx, dy);
          const difference = (ribbon.length - distance) / distance;

          const offsetX = dx * difference * 0.5;
          const offsetY = dy * difference * 0.5;

          if (!p1.pinned) {
            p1.x -= offsetX;
            p1.y -= offsetY;
          }
          if (!p2.pinned) {
            p2.x += offsetX;
            p2.y += offsetY;
          }
        }
      }
    });

    // 2. Rigid Pearl Physics
    for (let i = 0; i < this.pearls.length; i++) {
      const p = this.pearls[i];

      p.vy += this.gravity * 0.8;
      p.x += p.vx;
      p.y += p.vy;

      // Friction
      p.vx *= 0.99;
      p.vy *= 0.99;

      // Wall Bounce
      if (p.x - p.radius < 0) {
        p.x = p.radius;
        p.vx *= -0.75;
      } else if (p.x + p.radius > this.width) {
        p.x = this.width - p.radius;
        p.vx *= -0.75;
      }

      // Floor & Ceiling Bounce
      if (p.y + p.radius > this.height) {
        p.y = this.height - p.radius;
        p.vy *= -0.72;
        if (Math.abs(p.vy) < 0.2) p.vy = 0;
      } else if (p.y - p.radius < 0) {
        p.y = p.radius;
        p.vy *= -0.72;
      }

      // Mouse impulse
      const mdx = p.x - this.mouse.x;
      const mdy = p.y - this.mouse.y;
      const mDist = Math.hypot(mdx, mdy);
      if (mDist < 100) {
        const force = (1 - mDist / 100) * 1.5;
        p.vx += (mdx / mDist) * force;
        p.vy += (mdy / mDist) * force;
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const isDark = document.body.getAttribute('data-theme') === 'obsidian';

    // Draw Smooth Ribbon curves (Bézier spline)
    this.ribbons.forEach((ribbon) => {
      const points = ribbon.points;
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length - 2; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      this.ctx.quadraticCurveTo(
        points[points.length - 2].x,
        points[points.length - 2].y,
        points[points.length - 1].x,
        points[points.length - 1].y
      );

      this.ctx.strokeStyle = isDark
        ? 'rgba(255, 255, 255, 0.45)'
        : 'rgba(50, 48, 44, 0.35)';
      this.ctx.lineWidth = ribbon.width;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.stroke();

      // Delicate inner highlight line
      this.ctx.strokeStyle = isDark
        ? 'rgba(255, 255, 255, 0.7)'
        : 'rgba(255, 255, 255, 0.9)';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    });

    // Draw 3D Porcelain Pearls
    this.pearls.forEach((p) => {
      // Drop Shadow
      this.ctx.beginPath();
      this.ctx.ellipse(p.x, this.height - 4, p.radius * 0.9, p.radius * 0.25, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0,0,0,0.08)';
      this.ctx.fill();

      // Ceramic body with radial gradient highlight
      const grad = this.ctx.createRadialGradient(
        p.x - p.radius * 0.35,
        p.y - p.radius * 0.35,
        p.radius * 0.1,
        p.x,
        p.y,
        p.radius
      );

      if (isDark) {
        grad.addColorStop(0, '#555866');
        grad.addColorStop(0.7, '#23252d');
        grad.addColorStop(1, '#111216');
      } else {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.65, '#f0eee8');
        grad.addColorStop(1, '#cfcbbf');
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = grad;
      this.ctx.fill();

      // Specular rim
      this.ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)';
      this.ctx.lineWidth = 1.2;
      this.ctx.stroke();
    });
  }

  animate() {
    this.updateVerlet();
    this.draw();
    requestAnimationFrame(this.animate);
  }

  triggerPulse() {
    this.pearls.forEach((p) => {
      p.vy -= Math.random() * 8 + 6;
      p.vx += (Math.random() - 0.5) * 8;
    });
    this.ribbons.forEach((ribbon) => {
      ribbon.points.forEach((pt) => {
        if (!pt.pinned) {
          pt.x += (Math.random() - 0.5) * 40;
          pt.y -= Math.random() * 20;
        }
      });
    });
    if (window.soundEngine) {
      window.soundEngine.playChime(784, 0.4, 0.2);
    }
  }

  reset() {
    this.spawnInitialPearls();
    this.createRibbons();
    if (window.soundEngine) {
      window.soundEngine.playTap(440);
    }
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.ambientSystem = new BackgroundAmbientSystem('bg-canvas');
  window.kineticSandbox = new KineticSandbox('physics-canvas');
});
