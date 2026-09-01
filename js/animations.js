/**
 * LUMA 🌟 - Motor de Partículas y Canvas de Fondo
 */

(function() {
  class StarfieldBackground {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.particles = [];
      this.isMobile = window.innerWidth <= 768;
      this.numParticles = this.isMobile ? 35 : 75;
      this.animationFrameId = null;
      this.isRunning = false;

      this.resize = this.resize.bind(this);
      this.animate = this.animate.bind(this);

      window.addEventListener('resize', this.resize, { passive: true });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.stop();
        else this.start();
      });

      this.resize();
      this.createParticles();
      this.start();
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.isMobile = window.innerWidth <= 768;
      this.numParticles = this.isMobile ? 35 : 75;
      this.createParticles();
    }

    createParticles() {
      this.particles = [];
      // Paleta de partículas LUMA (Violeta, Azul, Turquesa, Oro luz)
      const colors = [
        'rgba(124, 58, 237, ',   // Violeta
        'rgba(59, 130, 246, ',   // Azul
        'rgba(34, 211, 238, ',   // Turquesa
        'rgba(250, 204, 21, '    // Oro luz
      ];

      for (let i = 0; i < this.numParticles; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: Math.random() * (this.isMobile ? 1.5 : 2.2) + 0.5,
          speedX: (Math.random() - 0.5) * 0.25,
          speedY: -Math.random() * 0.35 - 0.1,
          alpha: Math.random() * 0.6 + 0.2,
          colorBase: colors[Math.floor(Math.random() * colors.length)],
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleDir: Math.random() > 0.5 ? 1 : -1
        });
      }
    }

    start() {
      if (!this.isRunning) {
        this.isRunning = true;
        this.animate();
      }
    }

    stop() {
      this.isRunning = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }

    animate() {
      if (!this.isRunning || !this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let p of this.particles) {
        p.x += p.speedX;
        p.y += p.speedY;

        p.alpha += p.twinkleSpeed * p.twinkleDir;
        if (p.alpha > 0.85) {
          p.alpha = 0.85;
          p.twinkleDir = -1;
        } else if (p.alpha < 0.15) {
          p.alpha = 0.15;
          p.twinkleDir = 1;
        }

        if (p.y < -10) {
          p.y = this.canvas.height + 10;
          p.x = Math.random() * this.canvas.width;
        }
        if (p.x < -10) p.x = this.canvas.width + 10;
        if (p.x > this.canvas.width + 10) p.x = -10;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `${p.colorBase}${p.alpha})`;
        this.ctx.shadowBlur = p.size * 2;
        this.ctx.shadowColor = `${p.colorBase}0.8)`;
        this.ctx.fill();
      }

      this.animationFrameId = requestAnimationFrame(this.animate);
    }
  }

  // Animador numérico suave
  const animateCounter = (element, targetValue, duration = 1200, isDecimal = false) => {
    if (!element) return;
    const startTime = performance.now();
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeOutQuart(progress);
      const currentVal = easeProgress * targetValue;

      if (isDecimal) {
        element.textContent = window.Utils.formatDecimalES(currentVal, 1);
      } else {
        element.textContent = window.Utils.formatNumberES(Math.round(currentVal));
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        if (isDecimal) {
          element.textContent = window.Utils.formatDecimalES(targetValue, 1);
        } else {
          element.textContent = window.Utils.formatNumberES(targetValue);
        }
      }
    };

    requestAnimationFrame(step);
  };

  window.StarfieldBackground = StarfieldBackground;
  window.Animations = {
    animateCounter
  };
})();
