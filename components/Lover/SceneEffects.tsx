"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  SceneConfig,
  LightingConfig,
  ParticleType,
  ParticleConfig,
  PARTICLE_CONFIGS,
} from "@/lib/core/scene-system";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  shape: "circle" | "star" | "heart" | "petal";
  rotation: number;
  rotationSpeed: number;
  phase: number;
  life: number;
  maxLife: number;
}

export function SceneBackground({ scene }: { scene: SceneConfig }) {
  const transitionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transitionRef.current) {
      transitionRef.current.style.opacity = "0";
      requestAnimationFrame(() => {
        if (transitionRef.current) {
          transitionRef.current.style.opacity = "1";
        }
      });
    }
  }, [scene.id]);

  return (
    <div
      ref={transitionRef}
      className="absolute inset-0 z-0 transition-opacity duration-700"
      style={{
        background: scene.background,
      }}
    >
      <div
        className="absolute inset-0"
        style={{ background: scene.ambientGradient }}
      />
      <SceneDecorations sceneId={scene.id} />
    </div>
  );
}

function SceneDecorations({ sceneId }: { sceneId: string }) {
  const decorations = useMemo(() => {
    switch (sceneId) {
      case "bedroom":
        return (
          <>
            <div className="absolute top-[10%] right-[15%] w-32 h-32 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, #fff3e0 0%, transparent 70%)", filter: "blur(20px)" }} />
            <div className="absolute bottom-[15%] left-[10%] w-48 h-24 opacity-10"
              style={{ background: "linear-gradient(180deg, #8d6e63 0%, transparent 100%)", borderRadius: "8px" }} />
          </>
        );
      case "park":
        return (
          <>
            <div className="absolute top-[5%] left-[20%] w-20 h-20 rounded-full opacity-40"
              style={{ background: "radial-gradient(circle, #fff9c4 0%, transparent 70%)", filter: "blur(15px)" }} />
            <div className="absolute bottom-[5%] left-0 right-0 h-20 opacity-20"
              style={{ background: "linear-gradient(0deg, #558b2f 0%, transparent 100%)" }} />
          </>
        );
      case "cafe":
        return (
          <>
            <div className="absolute top-[20%] left-[10%] w-24 h-24 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #ffe0b2 0%, transparent 70%)", filter: "blur(20px)" }} />
            <div className="absolute top-[15%] right-[15%] w-16 h-16 opacity-15"
              style={{ background: "linear-gradient(45deg, #6d4c41, transparent)", borderRadius: "4px" }} />
          </>
        );
      case "beach":
        return (
          <>
            <div className="absolute top-[8%] right-[10%] w-28 h-28 rounded-full opacity-50"
              style={{ background: "radial-gradient(circle, #ffeb3b 0%, transparent 70%)", filter: "blur(20px)" }} />
            <div className="absolute bottom-[10%] left-0 right-0 h-16 opacity-20"
              style={{ background: "linear-gradient(0deg, #4fc3f7 0%, transparent 100%)" }} />
          </>
        );
      case "sakura":
        return (
          <>
            <div className="absolute top-[10%] left-[5%] w-32 h-32 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, #f8bbd0 0%, transparent 70%)", filter: "blur(25px)" }} />
            <div className="absolute top-[5%] right-[10%] w-24 h-24 rounded-full opacity-25"
              style={{ background: "radial-gradient(circle, #fce4ec 0%, transparent 70%)", filter: "blur(20px)" }} />
          </>
        );
      case "starry":
        return (
          <>
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: `${1 + Math.random() * 2}px`,
                  height: `${1 + Math.random() * 2}px`,
                  top: `${Math.random() * 60}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: 0.3 + Math.random() * 0.7,
                  animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
            <div className="absolute top-[8%] right-[12%] w-24 h-24 rounded-full opacity-60"
              style={{
                background: "radial-gradient(circle, #fff8e1 0%, #fff8e1 30%, transparent 70%)",
                filter: "blur(5px)",
              }} />
          </>
        );
      case "rooftop":
        return (
          <>
            <div className="absolute bottom-[5%] left-[10%] w-16 h-32 opacity-15"
              style={{ background: "linear-gradient(0deg, #4fc3f7, transparent)", borderRadius: "4px" }} />
            <div className="absolute bottom-[8%] right-[15%] w-12 h-24 opacity-10"
              style={{ background: "linear-gradient(0deg, #ff4081, transparent)", borderRadius: "4px" }} />
            <div className="absolute top-[10%] left-[30%] w-20 h-20 rounded-full opacity-15"
              style={{ background: "radial-gradient(circle, #e0e0ff 0%, transparent 70%)", filter: "blur(15px)" }} />
          </>
        );
      case "library":
        return (
          <>
            <div className="absolute top-[20%] left-[15%] w-20 h-20 opacity-10"
              style={{ background: "linear-gradient(90deg, #5d4037, #3e2723)", borderRadius: "4px" }} />
            <div className="absolute top-[25%] right-[20%] w-16 h-16 opacity-10"
              style={{ background: "linear-gradient(90deg, #6d4c41, #4e342e)", borderRadius: "4px" }} />
          </>
        );
      default:
        return null;
    }
  }, [sceneId]);

  return <>{decorations}</>;
}

export function LightingOverlay({ lighting }: { lighting: LightingConfig }) {
  return (
    <div
      className="absolute inset-0 z-[5] pointer-events-none transition-all duration-1000"
      style={{
        backgroundColor: lighting.overlayColor,
        opacity: lighting.overlayOpacity,
        mixBlendMode: "soft-light",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 60%, ${lighting.ambientLight} 0%, transparent 70%)`,
          mixBlendMode: "screen",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${lighting.shadowColor} 0%, transparent 30%, transparent 70%, ${lighting.shadowColor} 100%)`,
          opacity: 0.5,
        }}
      />
    </div>
  );
}

export function ParticleCanvas({
  particleType,
  mood,
}: {
  particleType: ParticleType;
  mood?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const config: ParticleConfig = useMemo(() => {
    if (particleType === "none") return PARTICLE_CONFIGS.none;
    if (mood === "love" || mood === "shy") return PARTICLE_CONFIGS.hearts;
    return PARTICLE_CONFIGS[particleType];
  }, [particleType, mood]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || config.type === "none") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const createParticle = (): Particle => {
      const shapes = config.shapes.length > 0 ? config.shapes : ["circle"];
      const colors = config.colors.length > 0 ? config.colors : ["#ffffff"];

      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * config.drift * 0.5,
        vy: config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed),
        size: config.minSize + Math.random() * (config.maxSize - config.minSize),
        opacity: config.minOpacity + Math.random() * (config.maxOpacity - config.minOpacity),
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        phase: Math.random() * Math.PI * 2,
        life: 0,
        maxLife: 300 + Math.random() * 300,
      };
    };

    particlesRef.current = Array.from({ length: config.count }, createParticle);

    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life += dt * 60;

        p.x += p.vx + Math.sin(p.phase + p.life * 0.02) * config.drift * 0.3;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.phase += dt;

        if (config.type === "stars" || config.type === "fireflies") {
          p.opacity = config.minOpacity +
            (config.maxOpacity - config.minOpacity) *
            (0.5 + 0.5 * Math.sin(p.life * 0.03 + p.phase));
        }

        if (p.y > canvas.height + p.size || p.life > p.maxLife) {
          if (particlesRef.current.length <= config.count) {
            particlesRef.current[i] = createParticle();
            particlesRef.current[i].y = -p.size;
            particlesRef.current[i].x = Math.random() * canvas.width;
          } else {
            particlesRef.current.splice(i, 1);
            continue;
          }
        }

        if (p.x < -p.size) p.x = canvas.width + p.size;
        if (p.x > canvas.width + p.size) p.x = -p.size;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        switch (p.shape) {
          case "circle":
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            if (p.color.startsWith("rgba")) {
              ctx.strokeStyle = p.color;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
            break;

          case "star":
            drawStar(ctx, 0, 0, 5, p.size / 2, p.size / 4);
            ctx.fill();
            break;

          case "heart":
            drawHeart(ctx, 0, 0, p.size);
            ctx.fill();
            break;

          case "petal":
            drawPetal(ctx, 0, 0, p.size);
            ctx.fill();
            break;
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
    };
  }, [config]);

  if (config.type === "none") return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  const s = size / 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 2);
  ctx.bezierCurveTo(cx - s * 3, cy - s, cx - s * 2, cy - s * 3, cx, cy - s);
  ctx.bezierCurveTo(cx + s * 2, cy - s * 3, cx + s * 3, cy - s, cx, cy + s * 2);
  ctx.closePath();
}

function drawPetal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.bezierCurveTo(cx + s, cy - s * 0.5, cx + s * 0.8, cy + s * 0.5, cx, cy + s);
  ctx.bezierCurveTo(cx - s * 0.8, cy + s * 0.5, cx - s, cy - s * 0.5, cx, cy - s);
  ctx.closePath();
}
