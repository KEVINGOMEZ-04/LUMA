/**
 * ATRIA ✨ - Motor de Animaciones y Canvas
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
      this.numStars = this.isMobile ? 25 : 75;
      this.numParticles = this.isMobile ? 4 : 12;
      this.animationFrameId = null;
      this.isRunning = false;
      this.lastWidth = 0;
      this.lastHeight = 0;
      this.lastFrameTime = 0;

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
      this.numStars = this.isMobile ? 30 : 80;
      this.numParticles = this.isMobile ? 6 : 14;
      
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
          size: Math.random() * (this.isMobile ? 1.2 : 1.6) + 0.4,
          alpha: Math.random() * 0.7 + 0.2,
          twinkleSpeed: Math.random() * 0.015 + 0.005,
          twinkleDir: Math.random() > 0.5 ? 1 : -1
        });
      }

      this.particles = [];
      for (let i = 0; i < this.numParticles; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: -Math.random() * 0.4 - 0.15,
          alpha: Math.random() * 0.5 + 0.2,
          color: Math.random() > 0.4 ? 'rgba(244, 197, 66, ' : 'rgba(185, 142, 230, '
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
        if (star.alpha > 0.9) {
          star.alpha = 0.9;
          star.twinkleDir = -1;
        } else if (star.alpha < 0.15) {
          star.alpha = 0.15;
          star.twinkleDir = 1;
        }

        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(241, 233, 251, ${star.alpha})`;
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
        this.ctx.fillStyle = `${p.color}${p.alpha})`;
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

  const triggerPetalRain = () => {
    const canvas = document.getElementById('effects-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const petals = [];
    const numPetals = 45;
    const colors = ['#F4C542', '#F8D96B', '#E5A91E', '#FBE58D'];

    for (let i = 0; i < numPetals; i++) {
      petals.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        sizeX: Math.random() * 12 + 10,
        sizeY: Math.random() * 6 + 4,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 4,
        speedY: Math.random() * 2 + 2,
        speedX: (Math.random() - 0.5) * 1.5,
        oscillationSpeed: Math.random() * 0.05 + 0.02,
        oscillationAmp: Math.random() * 30 + 10,
        oscillationOffset: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1
      });
    }

    let startTime = performance.now();
    const duration = 4000;

    const animate = (now) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let anyAlive = false;

      for (let petal of petals) {
        petal.y += petal.speedY;
        petal.rotation += petal.rotSpeed;
        const sway = Math.sin(elapsed * petal.oscillationSpeed * 0.05 + petal.oscillationOffset) * 1.2;
        petal.x += petal.speedX + sway;

        if (elapsed > duration - 1000) {
          petal.alpha = Math.max(0, (duration - elapsed) / 1000);
        }

        if (petal.y < canvas.height + 30 && petal.alpha > 0) {
          anyAlive = true;
          ctx.save();
          ctx.translate(petal.x, petal.y);
          ctx.rotate((petal.rotation * Math.PI) / 180);
          ctx.beginPath();
          ctx.ellipse(0, 0, petal.sizeX, petal.sizeY, 0, 0, Math.PI * 2);
          ctx.fillStyle = petal.color;
          ctx.globalAlpha = petal.alpha;
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#F4C542';
          ctx.fill();
          ctx.restore();
        }
      }

      if (elapsed < duration && anyAlive) {
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
    triggerPetalRain
  };
})();