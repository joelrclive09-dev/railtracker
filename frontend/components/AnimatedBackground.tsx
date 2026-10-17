"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  pulsePhase: number;
}

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const purples = ["rgba(139,92,246,", "rgba(124,58,237,", "rgba(167,139,250,"];
    const emeralds = ["rgba(16,185,129,", "rgba(52,211,153,", "rgba(110,231,183,"];

    const NUM_PARTICLES = Math.min(45, Math.floor((width * height) / 25000));
    const particles: Particle[] = [];

    for (let i = 0; i < NUM_PARTICLES; i++) {
      const isPurple = Math.random() > 0.45;
      const colorArr = isPurple ? purples : emeralds;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 1.8 + 0.8,
        color: colorArr[Math.floor(Math.random() * colorArr.length)],
        alpha: Math.random() * 0.35 + 0.1,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    const MAX_DIST = 120;
    let frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep dark radial backdrop
      const grad = ctx.createRadialGradient(
        width * 0.5, height * 0.35, 0,
        width * 0.5, height * 0.35, width * 0.75
      );
      grad.addColorStop(0, "rgba(20, 10, 40, 0.25)");
      grad.addColorStop(0.5, "rgba(5, 10, 20, 0.12)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      frame++;

      // Draw subtle connecting railway grid lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DIST) {
            const opacity = (1 - dist / MAX_DIST) * 0.14;
            const bothPurple = particles[i].color.includes("139,92");
            const lineColor = bothPurple
              ? `rgba(139,92,246,${opacity})`
              : `rgba(16,185,129,${opacity})`;

            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.setLineDash([3, 5]);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 0.6;
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      // Draw transit node particles
      for (const p of particles) {
        const pulse = Math.sin(frame * 0.02 + p.pulsePhase) * 0.25 + 0.75;
        const currentAlpha = p.alpha * pulse;

        // Subtle glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3.5);
        gradient.addColorStop(0, p.color + `${currentAlpha * 0.6})`);
        gradient.addColorStop(0.5, p.color + `${currentAlpha * 0.15})`);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = p.color + `${Math.min(currentAlpha * 1.4, 0.9)})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};
