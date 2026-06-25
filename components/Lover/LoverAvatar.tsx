"use client";

import { useEffect, useState } from "react";
import { MoodType, MOOD_CONFIG, LoverProfile } from "@/data/lover";

interface LoverAvatarProps {
  profile: LoverProfile;
  mood: MoodType;
  isTyping?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function LoverAvatar({ profile, mood, isTyping = false, size = "lg" }: LoverAvatarProps) {
  const [blink, setBlink] = useState(false);
  const [breath, setBreath] = useState(0);

  const moodConfig = MOOD_CONFIG[mood];

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    let frame = 0;
    let raf = 0;
    const animate = () => {
      frame += 0.02;
      setBreath(Math.sin(frame) * 3);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
  };

  const emojiSizes = {
    sm: "text-3xl",
    md: "text-5xl",
    lg: "text-7xl",
    xl: "text-8xl",
  };

  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`relative ${sizeClasses[size]} rounded-full flex items-center justify-center
          bg-gradient-to-br ${moodConfig.bgGradient}
          border-2 border-white/10
          shadow-2xl`}
        style={{
          transform: `translateY(${breath}px)`,
          boxShadow: `0 0 60px ${moodConfig.color}30, 0 0 100px ${moodConfig.color}15`,
        }}
      >
        <div
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${moodConfig.color}40, transparent 70%)`,
          }}
        />

        <div
          className={`${emojiSizes[size]} relative z-10 transition-all duration-300
            ${isTyping ? "animate-bounce" : ""}`}
          style={{
            filter: `drop-shadow(0 4px 20px ${moodConfig.color}60)`,
          }}
        >
          {moodConfig.emoji}
        </div>

        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full
            text-xs font-medium text-white/80
            bg-white/5 backdrop-blur-sm border border-white/10"
        >
          {moodConfig.label}
        </div>

        {isTyping && (
          <div className="absolute -right-1 -top-1 flex space-x-1 p-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-300 via-rose-300 to-violet-300 bg-clip-text text-transparent">
          {profile.name}
        </h2>
        <p className="text-sm text-white/50 mt-1">
          「{profile.nickname}」
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
          <span className="text-xs text-emerald-400/80">在线陪伴中</span>
        </div>
      </div>
    </div>
  );
}
