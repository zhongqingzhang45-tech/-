"use client";

import { useMemo, useState, useEffect } from "react";

interface GuofengAmbientProps {
  /** 落花数量，0 表示不显示 */
  petals?: number;
  /** 是否显示飘动祥云 */
  clouds?: boolean;
  /** 是否显示水墨光晕 */
  glow?: boolean;
  /** 主光晕色调 */
  glowColor?: string;
  className?: string;
}

/**
 * 国风氛围背景层 —— 祥云、落花、水墨光晕
 * 绝对定位铺满父容器，父容器需 position: relative 且 overflow: hidden
 */
export function GuofengAmbient({
  petals = 14,
  clouds = true,
  glow = true,
  glowColor = "rgba(200, 69, 60, 0.12)",
  className = "",
}: GuofengAmbientProps) {
  // 仅在客户端挂载后生成落花，避免 SSR/CSR 随机数不一致导致的 hydration 警告
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const petalList = useMemo(
    () =>
      Array.from({ length: petals }).map((_, i) => {
        const left = Math.random() * 100;
        const duration = 9 + Math.random() * 10;
        const delay = Math.random() * -18;
        const size = 8 + Math.random() * 10;
        const hue = Math.random() > 0.5 ? "#eea79a" : "#dcb363";
        const drift = (Math.random() - 0.5) * 40;
        return { i, left, duration, delay, size, hue, drift };
      }),
    [petals]
  );

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* 水墨光晕 */}
      {glow && (
        <>
          <div
            className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-60"
            style={{
              background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              filter: "blur(20px)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-40"
            style={{
              background: "radial-gradient(circle, rgba(74, 124, 126, 0.10) 0%, transparent 70%)",
              filter: "blur(30px)",
            }}
          />
        </>
      )}

      {/* 飘动祥云 */}
      {clouds && (
        <>
          <svg
            className="absolute top-[12%] left-0 w-64 opacity-[0.06] animate-float-cloud"
            viewBox="0 0 180 90"
            fill="none"
            stroke="#C9A961"
            strokeWidth="1.2"
          >
            <path d="M20 60 Q10 60 10 50 Q10 40 22 42 Q26 32 38 36 Q44 28 56 34 Q66 30 70 42 Q82 40 82 52 Q82 62 70 60 Z" />
          </svg>
          <svg
            className="absolute top-[55%] left-0 w-48 opacity-[0.05] animate-float-cloud"
            style={{ animationDuration: "60s", animationDelay: "-20s" }}
            viewBox="0 0 180 90"
            fill="none"
            stroke="#C9A961"
            strokeWidth="1.2"
          >
            <path d="M110 30 Q100 30 100 20 Q100 10 112 12 Q116 2 128 8 Q138 4 142 16 Q154 14 154 26 Q154 36 142 34 Z" />
          </svg>
        </>
      )}

      {/* 落花飞舞 —— 客户端挂载后再渲染，避免 hydration 不一致 */}
      {mounted && petalList.map((p) => (
        <span
          key={p.i}
          className="absolute top-0 animate-petal-fall"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.hue,
            borderRadius: `${p.size}px 0 ${p.size}px 0`,
            opacity: 0.7,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            transform: `translateX(${p.drift}px)`,
            filter: "blur(0.3px)",
          }}
        />
      ))}
    </div>
  );
}
