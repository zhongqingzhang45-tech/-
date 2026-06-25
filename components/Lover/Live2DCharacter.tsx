"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { MoodType } from "@/data/lover";

const Live2DPlayer = dynamic(
  () => import("./Live2DPlayer").then((mod) => mod.Live2DPlayer),
  { ssr: false }
);

export interface Live2DCharacterProps {
  model?: "mao_pro" | "shizuku";
  mood?: MoodType;
  isTyping?: boolean;
  isSpeaking?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  width?: number;
  height?: number;
  onTap?: (hitArea: string) => void;
  className?: string;
}

const SHIZUKU_MOOD_TO_EXPRESSION: Record<string, number> = {
  happy: 3,
  excited: 3,
  shy: 2,
  love: 3,
  sad: 1,
  angry: 2,
  jealous: 2,
  sleepy: 1,
  thoughtful: 0,
  playful: 3,
  surprised: 0,
  neutral: 0,
};

const MAOPRO_MOOD_TO_EXPRESSION: Record<string, number> = {
  happy: 1,
  excited: 1,
  shy: 3,
  love: 3,
  sad: 5,
  angry: 7,
  jealous: 7,
  sleepy: 6,
  thoughtful: 2,
  playful: 4,
  surprised: 0,
  neutral: 0,
};

const SIZE_MAP = {
  sm: { width: 160, height: 200 },
  md: { width: 240, height: 320 },
  lg: { width: 320, height: 420 },
  xl: { width: 400, height: 520 },
  full: { width: 500, height: 650 },
};

export function Live2DCharacter({
  model = "mao_pro",
  mood = "neutral",
  isTyping = false,
  isSpeaking = false,
  size = "md",
  width,
  height,
  onTap,
  className = "",
}: Live2DCharacterProps) {
  const [expression, setExpression] = useState<number>(0);
  const [mouthOpen, setMouthOpen] = useState(0);
  const mouthAnimRef = useRef<number>(0);

  const dimensions = SIZE_MAP[size];
  const finalWidth = width ?? dimensions.width;
  const finalHeight = height ?? dimensions.height;

  const moodMap = model === "shizuku" ? SHIZUKU_MOOD_TO_EXPRESSION : MAOPRO_MOOD_TO_EXPRESSION;

  useEffect(() => {
    const targetExp = moodMap[mood] ?? 0;
    setExpression(targetExp);
  }, [mood, moodMap]);

  useEffect(() => {
    if (!isSpeaking && !isTyping) {
      setMouthOpen(0);
      if (mouthAnimRef.current) {
        cancelAnimationFrame(mouthAnimRef.current);
      }
      return;
    }

    let startTime = performance.now();
    const baseSpeed = isSpeaking ? 8 : 5;

    const animateMouth = () => {
      const elapsed = performance.now() - startTime;
      const t = (elapsed / 1000) * baseSpeed;
      const openness = (Math.sin(t * Math.PI) * 0.5 + 0.5) * (isSpeaking ? 0.9 : 0.5);
      setMouthOpen(openness);
      mouthAnimRef.current = requestAnimationFrame(animateMouth);
    };

    mouthAnimRef.current = requestAnimationFrame(animateMouth);

    return () => {
      if (mouthAnimRef.current) {
        cancelAnimationFrame(mouthAnimRef.current);
      }
    };
  }, [isSpeaking, isTyping]);

  const handleHit = useCallback((hitAreas: string[]) => {
    onTap?.(hitAreas[0] || "body");
  }, [onTap]);

  return (
    <div
      className={`relative ${className}`}
      style={{ width: finalWidth, height: finalHeight }}
    >
      {/* Volumetric glow behind character */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-[85%] h-[85%] rounded-full blur-3xl opacity-25"
          style={{ 
            background: 'radial-gradient(ellipse at 50% 45%, rgba(236, 72, 153, 0.4), rgba(168, 85, 247, 0.2), transparent 70%)',
          }} 
        />
      </div>
      
      {/* Side color accents */}
      <div 
        className="absolute top-1/4 -left-4 w-1/3 h-1/2 rounded-full blur-[60px] opacity-20"
        style={{ background: 'radial-gradient(ellipse at center, rgba(244, 114, 182, 0.5), transparent 70%)' }}
      />
      <div 
        className="absolute top-1/3 -right-4 w-1/3 h-1/2 rounded-full blur-[60px] opacity-15"
        style={{ background: 'radial-gradient(ellipse at center, rgba(167, 139, 250, 0.5), transparent 70%)' }}
      />

      {/* Bottom reflection glow */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-2/3 h-6 rounded-full blur-2xl opacity-40"
        style={{ background: 'radial-gradient(ellipse at center, rgba(251, 207, 232, 0.6), transparent 70%)' }}
      />

      {/* Subtle rim light */}
      <div 
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, transparent 40%, rgba(255, 255, 255, 0.1) 70%, transparent 100%)',
        }}
      />

      <Live2DPlayer
        modelUrl={`/live2d-models/${model}/runtime/${model}.model3.json`}
        width={finalWidth}
        height={finalHeight}
        expression={expression}
        mouthOpenSize={mouthOpen}
        nowSpeaking={isSpeaking || isTyping}
        scale={1}
        autoBlink={true}
        idleAnimation={true}
        eyeTracking={true}
        onHit={handleHit}
      />
    </div>
  );
}
