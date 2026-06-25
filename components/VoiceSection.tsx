"use client";

import { useState, useEffect, useRef } from "react";

const SAMPLE_MESSAGES = [
  { from: "her", text: "在呢，怎么啦？", time: "刚刚" },
  { from: "me", text: "今天工作好累啊…", time: "刚刚" },
  { from: "her", text: "抱抱～ 累了就休息一下嘛。今天遇到什么难搞的事了？跟我说说？", time: "刚刚" },
  { from: "me", text: "项目又改需求了，烦死", time: "刚刚" },
  { from: "her", text: "哎呀，改需求确实超烦的… 不过你已经做得很好啦。想不想我陪你玩会儿游戏放松一下？", time: "刚刚" },
];

export function VoiceSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBars, setAudioBars] = useState<number[]>(Array(24).fill(0));
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isPlaying) {
      setAudioBars(Array(24).fill(0));
      return;
    }

    const animate = () => {
      setAudioBars(
        Array(24)
          .fill(0)
          .map(() => Math.random() * 60 + 20)
      );
      animationRef.current = requestAnimationFrame(animate);
    };

    const interval = setInterval(() => {
      setAudioBars(
        Array(24)
          .fill(0)
          .map(() => Math.random() * 60 + 20)
      );
    }, 80);

    return () => {
      clearInterval(interval);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 py-32">
      <div className="mb-16 text-center">
        <div className="mb-3 text-xs uppercase tracking-[0.3em] text-purple-400/80">Real-time Voice</div>
        <h2 className="text-3xl font-light text-white md:text-4xl mb-4">
          <span className="text-gradient-soft">她的声音，近在耳边</span>
        </h2>
        <p className="mx-auto max-w-xl text-sm text-gray-400 md:text-base leading-relaxed">
          基于 GLM-4-Voice 的实时语音对话。
          <br />
          温柔的音色、自然的停顿、真实的情绪——就像她真的在你身边。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 order-2 lg:order-1">
          <div className="glass-dream rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                <span className="text-xs text-pink-300">语音对话中</span>
              </div>
              <span className="text-xs text-gray-500 font-mono">02:34</span>
            </div>

            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto scroll-mask-soft">
              {SAMPLE_MESSAGES.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
                  style={{ animation: `slideUp 0.4s ease-out ${i * 0.1}s both` }}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.from === "me"
                        ? "bg-gradient-to-br from-pink-500/30 to-purple-500/30 text-white rounded-br-md"
                        : "bg-white/[0.06] text-gray-200 rounded-bl-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isPlaying && (
                <div className="flex justify-start">
                  <div className="flex items-end gap-1.5 px-4 py-3 rounded-2xl bg-white/[0.06]">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1 h-3 bg-pink-400 rounded-full voice-bar"
                        style={{
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`relative flex h-12 w-12 items-center justify-center rounded-full transition ${
                    isPlaying
                      ? "bg-gradient-to-br from-pink-500 to-purple-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                  style={{
                    boxShadow: isPlaying ? "0 0 20px rgba(244,114,182,0.4)" : "none",
                  }}
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 flex items-end justify-center gap-0.5 h-8">
                  {audioBars.map((height, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full transition-all duration-75"
                      style={{
                        height: `${isPlaying ? height : 4}%`,
                        background: isPlaying
                          ? `linear-gradient(to top, #f472b6, #a78bfa)`
                          : "rgba(255,255,255,0.1)",
                      }}
                    />
                  ))}
                </div>

                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 order-1 lg:order-2 space-y-4">
          <FeatureCard
            icon="🎙️"
            title="实时语音"
            desc="低延迟语音对话，就像打电话一样自然。GLM-4-Voice 驱动，情绪饱满。"
            color="pink"
          />
          <FeatureCard
            icon="👂"
            title="听懂情绪"
            desc="她能感知你的语气变化，开心时陪你笑，难过时给你安慰。"
            color="purple"
          />
          <FeatureCard
            icon="💬"
            title="文字+语音"
            desc="文字和语音无缝切换。不方便说话的时候，打字她也能收到。"
            color="amber"
          />
          <FeatureCard
            icon="🎵"
            title="专属音色"
            desc="不止预设音色，你可以定制她的声音——温柔、活泼、清冷，由你决定。"
            color="emerald"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  color,
}: {
  icon: string;
  title: string;
  desc: string;
  color: "pink" | "purple" | "amber" | "emerald";
}) {
  const colorMap = {
    pink: "from-pink-500/20 to-pink-500/5 border-pink-500/20",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
  };

  return (
    <div
      className={`p-5 rounded-2xl border bg-gradient-to-br ${colorMap[color]} transition hover:scale-[1.02]`}
    >
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="text-sm font-medium text-white mb-1.5">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}
