import React, { useEffect, useRef } from 'react';

const StarryBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    // Resize handler
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      const dpr = window.devicePixelRatio || 1;

      // Set actual size in memory (scaled to account for extra pixel density)
      if (parent) {
        canvas.width = parent.offsetWidth * dpr;
        canvas.height = parent.offsetHeight * dpr;

        // Normalize coordinate system to use css pixels
        ctx.scale(dpr, dpr);

        // Reset particles for new bounds
        initParticles(parent.offsetWidth, parent.offsetHeight);
      }
    };

    // Particle class
    class Particle {
      constructor(width, height) {
        this.w = width;
        this.h = height;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update(mouseX, mouseY) {
        this.x += this.speedX;
        this.y += this.speedY;

        // Parallax-like interaction
        if (mouseX && mouseY) {
          const dx = mouseX - this.x;
          const dy = mouseY - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 150) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (150 - distance) / 150;
            const directionX = forceDirectionX * force * 2;
            const directionY = forceDirectionY * force * 2;

            this.x -= directionX;
            this.y -= directionY;
          }
        }

        // Wrap around
        if (this.x > this.w) this.x = 0;
        if (this.x < 0) this.x = this.w;
        if (this.y > this.h) this.y = 0;
        if (this.y < 0) this.y = this.h;
      }

      draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`; // White particles for blue bg
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const initParticles = (w, h) => {
      particles = [];
      const particleCount = 60;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(w, h));
      }
    };

    let mouseX = 0;
    let mouseY = 0;

    const animate = () => {
      // Clear with offsetWidth/Height (the logic coordinate space)
      if (canvas.parentElement) {
        ctx.clearRect(0, 0, canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);

        // Draw connections
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; // White very light
        ctx.lineWidth = 0.5;

        for (let i = 0; i < particles.length; i++) {
          for (let j = i; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }

        particles.forEach(p => {
          p.update(mouseX, mouseY);
          p.draw();
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      // Correct mouse coordinates relative to canvas
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resizeCanvas);

    // Init after mount
    setTimeout(resizeCanvas, 100);
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
};

export default StarryBackground;
