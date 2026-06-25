"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  type: "heart" | "star" | "circle";
  alpha: number;
  color: string;
}

export function LoverParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let raf = 0;
    let time = 0;

    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    setSize();

    const colors = ["#f472b6", "#a78bfa", "#fb7185", "#c084fc", "#f9a8d4"];
    const particles: Particle[] = [];
    const count = Math.min(60, Math.floor((width * height) / 30000));

    for (let i = 0; i < count; i++) {
      const types: ("heart" | "star" | "circle")[] = ["heart", "star", "circle"];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.2 - Math.random() * 0.4,
        r: Math.random() * 3 + 2,
        type: types[Math.floor(Math.random() * types.length)],
        alpha: Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const drawHeart = (x: number, y: number, size: number) => {
      ctx.beginPath();
      const topCurveHeight = size * 0.3;
      ctx.moveTo(x, y + size * 0.3);
      ctx.bezierCurveTo(x, y, x - size, y, x - size, y + topCurveHeight);
      ctx.bezierCurveTo(x - size, y + size * 0.6, x, y + size, x, y + size);
      ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.6, x + size, y + topCurveHeight);
      ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3);
      ctx.closePath();
    };

    const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx + Math.sin(time + i) * 0.15;
        p.y += p.vy;

        if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        const pulseAlpha = p.alpha * (0.7 + Math.sin(time * 2 + i) * 0.3);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = pulseAlpha;

        if (p.type === "heart") {
          drawHeart(p.x, p.y, p.r * 1.2);
          ctx.fill();
        } else if (p.type === "star") {
          drawStar(p.x, p.y, 5, p.r, p.r * 0.5);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => setSize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a1f] via-[#0f0a1f] to-[#0a0a1a]" />
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-pink-500/15 blur-[120px]" />
      <div className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-[100px]" />
      <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-rose-500/10 blur-[120px]" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
