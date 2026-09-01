/**
 * LUMA 🌟 - Motor de Animaciones y Partículas Cósmicas
 */

(function() {
  class StarfieldBackground {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.stars = [];
      this.particles = [];
      this.isMobile = window.innerWidth <= 768;
      this.numStars = this.isMobile ? 35 : 90;
      this.numParticles = this.isMobile ? 6 : 16;
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

      window.addEventListener('orientationchange', () => setTimeout(this.resize, 300), { passive: true });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stop();
        } else {
          this.start();
        }
      });

      this.resize();
      this.createElements();
      this.start();
    }

    resize() {
      if (!this.canvas) return;
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;

      if (this.lastWidth === currentWidth && this.lastHeight === currentHeight) {
        return;
      }

      this.lastWidth = currentWidth;
      this.lastHeight = currentHeight;
      this.isMobile = currentWidth <= 768;
      this.numStars = this.isMobile ? 35 : 90;
      this.numParticles = this.isMobile ? 6 : 16;
      
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
          size: Math.random() * (this.isMobile ? 1.4 : 1.8) + 0.5,
          alpha: Math.random() * 0.7 + 0.2,
          twinkleSpeed: Math.random() * 0.015 + 0.005,
          twinkleDir: Math.random() > 0.5 ? 1 : -1
        });
      }

      this.particles = [];
      const colors = ['rgba(124, 58, 237, ', 'rgba(59, 130, 246, ', 'rgba(34, 211, 238, ', 'rgba(250, 204, 21, '];
      for (let i = 0; i < this.numParticles; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: Math.random() * 2.5 + 1.2,
          speedX: (Math.random() - 0.5) * 0.35,
          speedY: -Math.random() * 0.45 - 0.15,
          alpha: Math.random() * 0.6 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)]
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

      for (let star of this.stars) {
        star.alpha += star.twinkleSpeed * star.twinkleDir;
        if (star.alpha > 0.95) {
          star.alpha = 0.95;
          star.twinkleDir = -1;
        } else if (star.alpha < 0.15) {
          star.alpha = 0.15;
          star.twinkleDir = 1;
        }

        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(226, 232, 240, ${star.alpha})`;
        this.ctx.fill();
      }

      for (let p of this.particles) {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < -10) {
          p.y = this.canvas.height + 10;
          p.x = Math.random() * this.canvas.width;
        }
        if (p.x < -10) p.x = this.canvas.width + 10;
        if (p.x > this.canvas.width + 10) p.x = -10;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color + p.alpha + ')';
        this.ctx.fill();
      }

      this.animationFrameId = requestAnimationFrame(this.animate);
    }
  }

  const animateCounter = (element, targetValue, duration = 1800, isDecimal = false) => {
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
    const numParticles = 50;
    const colors = ['#7C3AED', '#3B82F6', '#22D3EE', '#FACC15', '#FFFFFF'];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: Math.random() * 4 + 2,
        angle: Math.random() * Math.PI * 2,
        speed: Math.random() * 6 + 2,
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
          ctx.shadowBlur = 8;
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
