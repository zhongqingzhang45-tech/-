"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Live2DPlayer } from "./Live2DPlayer";
import { MoodType } from "@/data/lover";

export interface Live2DCharacterProps {
  model?: "mao_pro" | "shizuku";
  mood?: MoodType;
  isTyping?: boolean;
  isSpeaking?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  width?: number;
  height?: number;
  onTap?: (hitArea: string) => void;
  className?: string;
}

const MOOD_TO_EXPRESSION: Record<string, string> = {
  happy: "exp_02",
  excited: "exp_02",
  shy: "exp_04",
  love: "exp_04",
  sad: "exp_06",
  angry: "exp_08",
  jealous: "exp_08",
  sleepy: "exp_07",
  thoughtful: "exp_03",
  playful: "exp_05",
  surprised: "exp_01",
  neutral: "exp_01",
};

const MOOD_TO_MOTION: Partial<Record<string, { group: string; index: number }>> = {
  happy: { group: "", index: 1 },
  excited: { group: "", index: 2 },
  shy: { group: "", index: 3 },
  love: { group: "", index: 4 },
  playful: { group: "", index: 3 },
  surprised: { group: "", index: 5 },
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
  onTap,
  className = "",
}: Live2DCharacterProps) {
  const [expression, setExpression] = useState<string>("exp_01");
  const [motion, setMotion] = useState<string | undefined>(undefined);
  const [motionIndex, setMotionIndex] = useState(0);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const mouthAnimRef = useRef<number>(0);

  const dimensions = SIZE_MAP[size];
  const finalWidth = width ?? dimensions.width;
  const finalHeight = height ?? dimensions.height;

  useEffect(() => {
    const targetExpression = MOOD_TO_EXPRESSION[mood] || "exp_01";
    setExpression(targetExpression);

    const moodMotion = MOOD_TO_MOTION[mood];
    if (moodMotion) {
      setMotion(moodMotion.group);
      setMotionIndex(moodMotion.index);
    }
  }, [mood]);

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

  const handleError = useCallback((err: Error) => {
    console.warn("Live2D model load error:", err);
  }, []);

  return (
    <div
      className={`relative ${className}`}
      style={{ width: finalWidth, height: finalHeight }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-pink-100/10 via-transparent to-rose-100/10 rounded-full blur-2xl" />

      <Live2DPlayer
        modelUrl={`/live2d-models/${model}/runtime/${model}.model3.json`}
        width={finalWidth}
        height={finalHeight}
        expression={expression}
        mouthOpenSize={mouthOpen}
        nowSpeaking={isSpeaking || isTyping}
        motion={motion}
        motionIndex={motionIndex}
        scale={1}
        autoBlink={true}
        idleAnimation={true}
        eyeTracking={true}
        onModelLoaded={handleModelLoaded}
        onError={handleError}
      />

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-pink-200/30 rounded-full blur-xl" />
    </div>
  );
}
