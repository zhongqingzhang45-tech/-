"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

const Live2DPlayer = dynamic(
  () => import("./Live2DPlayer").then((mod) => mod.Live2DPlayer),
  { ssr: false }
);

export interface Live2DCharacterProps {
  model?: "mao_pro" | "shizuku";
  mood?: string;
  isTyping?: boolean;
  isSpeaking?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  width?: number;
  height?: number;
  scale?: number;
  onTap?: (hitArea: string) => void;
  className?: string;
}

const MODELS = {
  mao_pro: {
    url: "/live2d-models/mao_pro/runtime/mao_pro.model3.json",
    kScale: 0.5,
    initialXshift: 0,
    initialYshift: 0,
    idleMotionGroupName: "Idle",
    emotionMap: {
      neutral: 0,
      happy: 3,
      excited: 3,
      shy: 4,
      love: 4,
      sad: 1,
      angry: 2,
      jealous: 2,
      sleepy: 7,
      thoughtful: 3,
      playful: 5,
      surprised: 3,
    } as Record<string, number>,
  },
  shizuku: {
    url: "/live2d-models/shizuku/runtime/shizuku.model3.json",
    kScale: 0.5,
    initialXshift: 0,
    initialYshift: 0,
    idleMotionGroupName: "Idle",
    emotionMap: {
      neutral: 0,
      happy: 3,
      excited: 3,
      shy: 4,
      love: 4,
      sad: 1,
      angry: 2,
      jealous: 2,
      sleepy: 7,
      thoughtful: 3,
      playful: 5,
      surprised: 3,
    } as Record<string, number>,
  },
};

const SIZE_MAP = {
  sm: { width: 160, height: 200 },
  md: { width: 240, height: 300 },
  lg: { width: 320, height: 400 },
  xl: { width: 400, height: 500 },
};

export function Live2DCharacter({
  model = "mao_pro",
  mood = "neutral",
  isTyping = false,
  isSpeaking = false,
  size = "md",
  width,
  height,
  scale = 1,
  onTap,
  className = "",
}: Live2DCharacterProps) {
  const [expression, setExpression] = useState<number>(0);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const mouthAnimRef = useRef<number>(0);

  const modelConfig = MODELS[model];
  const dimensions = SIZE_MAP[size];
  const finalWidth = width ?? dimensions.width;
  const finalHeight = height ?? dimensions.height;

  useEffect(() => {
    const emotionIndex = modelConfig.emotionMap[mood] ?? 0;
    setExpression(emotionIndex);
  }, [mood, modelConfig]);

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
      const openness = (Math.sin(t * Math.PI) * 0.5 + 0.5) * (isSpeaking ? 0.8 : 0.4);
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

  const handleModelLoaded = useCallback(() => {
    setModelLoaded(true);
  }, []);

  const handleHit = useCallback(
    (hitAreas: string[]) => {
      if (onTap && hitAreas.length > 0) {
        onTap(hitAreas[0]);
      }
    },
    [onTap]
  );

  return (
    <div
      className={`relative ${className}`}
      style={{ width: finalWidth, height: finalHeight }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-pink-200/20 via-transparent to-rose-200/20 rounded-full blur-3xl opacity-60" />

      <Live2DPlayer
        modelUrl={modelConfig.url}
        width={finalWidth}
        height={finalHeight}
        expression={expression}
        mouthOpenSize={mouthOpen}
        nowSpeaking={isSpeaking || isTyping}
        scale={scale * modelConfig.kScale}
        positionOffset={{
          x: modelConfig.initialXshift,
          y: modelConfig.initialYshift,
        }}
        idleMotionGroupName={modelConfig.idleMotionGroupName}
        autoBlink={true}
        idleAnimation={true}
        eyeTracking={true}
        onModelLoaded={handleModelLoaded}
        onHit={handleHit}
      />

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-3 bg-pink-300/30 rounded-full blur-xl" />
    </div>
  );
}
