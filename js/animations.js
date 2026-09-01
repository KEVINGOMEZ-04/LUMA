/**
 * LUMA 🌟 - Motor de Animaciones, Nebulosa Ambiental y Partículas Cósmicas
 */

(function() {
  class StarfieldBackground {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.stars = [];
      this.orbs = [];
      this.isMobile = window.innerWidth <= 768;
      this.numStars = this.isMobile ? 30 : 65;
      this.animationFrameId = null;
      this.isRunning = false;
      this.lastWidth = 0;
      this.lastHeight = 0;

      this.resize = this.resize.bind(this);
      this.animate = this.animate.bind(this);

      let resizeTimeout = null;
      window.addEventListener('resize', () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(this.resize, 200);
      }, { passive: true });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.stop();
        else this.start();
      });

      this.resize();
      this.createElements();
      this.start();
    }

    resize() {
      if (!this.canvas) return;
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;

      if (this.lastWidth === currentWidth && this.lastHeight === currentHeight) return;

      this.lastWidth = currentWidth;
      this.lastHeight = currentHeight;
      this.isMobile = currentWidth <= 768;
      this.numStars = this.isMobile ? 30 : 65;
      
      this.canvas.width = currentWidth;
      this.canvas.height = currentHeight;
      this.createElements();
    }

    createElements() {
      this.stars = [];
      for (let i = 0; i < this.numStars; i++) {
        this.stars.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.5 + 0.1,
          baseAlpha: Math.random() * 0.5 + 0.1,
          twinkleSpeed: Math.random() * 0.01 + 0.003,
          twinkleDir: Math.random() > 0.5 ? 1 : -1,
          speedY: -Math.random() * 0.15 - 0.03
        });
      }

      // Nebulosas Ambientales Suaves
      this.orbs = [
        {
          x: this.canvas.width * 0.2,
          y: this.canvas.height * 0.15,
          radius: Math.min(this.canvas.width, this.canvas.height) * 0.45,
          color: 'rgba(99, 102, 241, 0.09)',
          vx: 0.1,
          vy: 0.08
        },
        {
          x: this.canvas.width * 0.8,
          y: this.canvas.height * 0.6,
          radius: Math.min(this.canvas.width, this.canvas.height) * 0.4,
          color: 'rgba(6, 182, 212, 0.07)',
          vx: -0.09,
          vy: 0.06
        },
        {
          x: this.canvas.width * 0.5,
          y: this.canvas.height * 0.85,
          radius: Math.min(this.canvas.width, this.canvas.height) * 0.5,
          color: 'rgba(168, 85, 247, 0.06)',
          vx: 0.07,
          vy: -0.08
        }
      ];
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

      // 1. Dibujar Nebulosas Ambientales
      for (let orb of this.orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (orb.x < 0 || orb.x > this.canvas.width) orb.vx *= -1;
        if (orb.y < 0 || orb.y > this.canvas.height) orb.vy *= -1;

        const grad = this.ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, 'transparent');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // 2. Dibujar Estrellas Suaves
      for (let star of this.stars) {
        star.y += star.speedY;
        if (star.y < -5) {
          star.y = this.canvas.height + 5;
          star.x = Math.random() * this.canvas.width;
        }

        star.alpha += star.twinkleSpeed * star.twinkleDir;
        if (star.alpha > 0.75) {
          star.alpha = 0.75;
          star.twinkleDir = -1;
        } else if (star.alpha < 0.1) {
          star.alpha = 0.1;
          star.twinkleDir = 1;
        }

        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(248, 250, 252, ${star.alpha})`;
        this.ctx.fill();
      }

      this.animationFrameId = requestAnimationFrame(this.animate);
    }
  }

  const animateCounter = (element, targetValue, duration = 1600, isDecimal = false) => {
    if (!element) return;
    const startTime = performance.now();
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeOutQuart(progress);
      const currentVal = easeProgress * targetValue;

      if (isDecimal) {
        element.textContent = window.Utils.formatDecimalES(currentVal, 2) + ' %';
      } else {
        element.textContent = window.Utils.formatNumberES(Math.round(currentVal));
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        if (isDecimal) {
          element.textContent = window.Utils.formatDecimalES(targetValue, 2) + ' %';
        } else {
          element.textContent = window.Utils.formatNumberES(targetValue);
        }
      }
    };

    requestAnimationFrame(step);
  };

  const triggerLumaBurst = () => {
    const canvas = document.getElementById('effects-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const numParticles = 40;
    const colors = ['#818CF8', '#38BDF8', '#FBBF24', '#C084FC', '#FFFFFF'];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: Math.random() * 3.5 + 1.5,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let anyAlive = false;

      for (let p of particles) {
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        p.alpha -= p.decay;

        if (p.alpha > 0) {
          anyAlive = true;
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.restore();
        }
      }

      if (anyAlive) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    requestAnimationFrame(animate);
  };

  window.StarfieldBackground = StarfieldBackground;
  window.Animations = {
    animateCounter,
    triggerLumaBurst
  };
})();