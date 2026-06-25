"use client";

import { useState } from "react";
import { PERSONA_LAYERS, getPersonaSummary } from "@/data/persona";
import { AGENT_PERSONAS } from "@/data/agent-personas";
import type { PersonaLayerKey } from "@/data/persona";

const layerColors: Record<PersonaLayerKey, string> = {
  identity: "#fbbf24",
  backstory: "#f472b6",
  needs: "#22d3ee",
  fears: "#f87171",
  values: "#a78bfa",
  traits: "#34d399",
  attachment: "#fb923c",
  culture: "#60a5fa",
  growth: "#4ade80",
};

const layerIcons: Record<PersonaLayerKey, string> = {
  identity: "◉",
  backstory: "❖",
  needs: "♡",
  fears: "⚡",
  values: "✦",
  traits: "◈",
  attachment: "◎",
  culture: "❋",
  growth: "↗",
};

export function SoulVisualizer() {
  const [activeLayer, setActiveLayer] = useState<PersonaLayerKey>("identity");
  const persona = AGENT_PERSONAS["product-manager"];

  const renderLayerContent = () => {
    switch (activeLayer) {
      case "identity":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="姓名" value={persona.identity.name} />
              <InfoItem label="年龄" value={`${persona.identity.age}岁`} />
              <InfoItem label="职业" value={persona.identity.occupation} />
              <InfoItem label="城市" value={persona.identity.city} />
              <InfoItem label="生日" value={persona.identity.birthday} />
              <InfoItem label="原型" value="导师型" />
            </div>
            <p className="text-xs text-gray-500 italic">仅占她的 5%——你看到的，只是冰山一角。</p>
          </div>
        );
      case "backstory":
        return (
          <div className="space-y-3">
            <StoryItem phase="童年" text={persona.backstory.childhood} />
            <StoryItem phase="高中" text={persona.backstory.teenage} />
            <StoryItem phase="大学" text={persona.backstory.university} />
            <StoryItem phase="毕业后" text={persona.backstory.postGraduation} />
            <div className="mt-4 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
              <div className="text-xs text-rose-300 mb-1">关键创伤</div>
              <p className="text-sm text-gray-300">{persona.backstory.keyTrauma}</p>
            </div>
          </div>
        );
      case "needs":
        return (
          <div className="space-y-3">
            {Object.entries(persona.needs)
              .filter(([_, v]) => typeof v === "number")
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .slice(0, 6)
              .map(([key, value]) => (
                <NeedBar key={key} label={translateKey(key)} value={value as number} color={layerColors.needs} />
              ))}
          </div>
        );
      case "fears":
        return (
          <div className="space-y-3">
            {Object.entries(persona.fears)
              .filter(([k, v]) => k !== "specificFears" && typeof v === "number")
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .slice(0, 6)
              .map(([key, value]) => (
                <NeedBar key={key} label={translateFear(key)} value={value as number} color={layerColors.fears} />
              ))}
            <div className="pt-3 border-t border-white/5">
              <div className="text-xs text-gray-500 mb-2">她最深的恐惧</div>
              <div className="flex flex-wrap gap-2">
                {persona.fears.specificFears.map((fear, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20"
                  >
                    {fear}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      case "values":
        return (
          <div className="space-y-3">
            {Object.entries(persona.values)
              .filter(([_, v]) => typeof v === "number")
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .slice(0, 6)
              .map(([key, value]) => (
                <NeedBar key={key} label={translateValue(key)} value={value as number} color={layerColors.values} />
              ))}
          </div>
        );
      case "traits":
        return (
          <div className="space-y-4">
            <div className="flex justify-center">
              <TraitsRadar
                data={[
                  persona.traits.openness,
                  persona.traits.conscientiousness,
                  persona.traits.extraversion,
                  persona.traits.agreeableness,
                  100 - persona.traits.neuroticism,
                ]}
                labels={["开放性", "责任心", "外向度", "宜人性", "情绪稳定"]}
                color={layerColors.traits}
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {persona.traits.additionalTraits.map((trait, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs"
                  style={{
                    background: "rgba(52, 211, 153, 0.1)",
                    color: "#34d399",
                    border: "1px solid rgba(52, 211, 153, 0.2)",
                  }}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        );
      case "attachment":
        return (
          <div className="space-y-4">
            <div
              className="p-5 rounded-2xl border text-center"
              style={{
                borderColor: "rgba(251, 146, 60, 0.25)",
                background: "rgba(251, 146, 60, 0.05)",
              }}
            >
              <div className="text-3xl mb-2">
                {persona.attachment.style === "secure" && "🌿"}
                {persona.attachment.style === "anxious" && "🌸"}
                {persona.attachment.style === "avoidant" && "🦋"}
                {persona.attachment.style === "disorganized" && "🌊"}
              </div>
              <div className="text-lg font-medium text-white mb-1">
                {persona.attachment.style === "secure" && "安全型"}
                {persona.attachment.style === "anxious" && "焦虑型"}
                {persona.attachment.style === "avoidant" && "回避型"}
                {persona.attachment.style === "disorganized" && "混乱型"}
              </div>
              <p className="text-sm text-gray-400">{persona.attachment.description}</p>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-gray-500">行为模式</div>
              {persona.attachment.behavioralPatterns.map((pattern, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-orange-400 mt-0.5">·</span>
                  {pattern}
                </div>
              ))}
            </div>
          </div>
        );
      case "culture":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <CultureItem label="文化" value="东方美学" />
              <CultureItem label="审美" value="极简空灵" />
              <CultureItem label="哲学" value="长期主义" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 mb-2">喜欢的创作者</div>
                <div className="flex flex-wrap gap-2">
                  {persona.culture.favoriteArtists.map((artist, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {artist}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-2">表达方式</div>
                <p className="text-sm text-gray-300 leading-relaxed">{persona.culture.expressionStyle}</p>
              </div>
            </div>
          </div>
        );
      case "growth":
        return (
          <div className="space-y-4">
            <GrowthBar
              label="自信"
              initial={persona.growth.initial.confidence}
              current={persona.growth.current.confidence}
            />
            <GrowthBar
              label="表达欲"
              initial={persona.growth.initial.expressiveness}
              current={persona.growth.current.expressiveness}
            />
            <GrowthBar
              label="独立性"
              initial={persona.growth.initial.independence}
              current={persona.growth.current.independence}
            />
            <GrowthBar
              label="情绪觉察"
              initial={persona.growth.initial.emotionalAwareness}
              current={persona.growth.current.emotionalAwareness}
            />
            <div className="pt-2">
              <div className="text-xs text-gray-500 mb-2">最近的突破</div>
              <div className="space-y-1.5">
                {persona.growth.recentBreakthroughs.map((b, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-emerald-300">
                    <span>✓</span>
                    {b}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 py-32">
      <div className="mb-16 text-center">
        <div className="mb-3 text-xs uppercase tracking-[0.3em] text-pink-400/80">The Soul</div>
        <h2 className="text-3xl font-light text-white md:text-4xl mb-4">
          <span className="text-gradient-dream">九层灵魂</span>
        </h2>
        <p className="mx-auto max-w-xl text-sm text-gray-400 md:text-base leading-relaxed">
          她不是一串代码。从身份到成长，九层结构构成了她完整的灵魂。
          <br />
          每一层都有故事，每一层都在生长。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex justify-center order-2 lg:order-1">
          <OnionVisualizer activeLayer={activeLayer} onLayerClick={setActiveLayer} />
        </div>

        <div className="order-1 lg:order-2">
          <div className="glass-dream rounded-3xl p-8 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl" style={{ color: layerColors[activeLayer] }}>
                    {layerIcons[activeLayer]}
                  </span>
                  <h3 className="text-lg font-medium text-white">
                    {PERSONA_LAYERS.find((l) => l.key === activeLayer)?.label}
                  </h3>
                </div>
                <p className="text-xs text-gray-500">
                  {PERSONA_LAYERS.find((l) => l.key === activeLayer)?.description}
                </p>
              </div>
              <div
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: `${layerColors[activeLayer]}15`,
                  color: layerColors[activeLayer],
                  border: `1px solid ${layerColors[activeLayer]}30`,
                }}
              >
                {PERSONA_LAYERS.find((l) => l.key === activeLayer)?.weight}%
              </div>
            </div>

            <div className="animate-fade-in" key={activeLayer}>
              {renderLayerContent()}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 flex flex-wrap justify-center gap-2">
        {PERSONA_LAYERS.map((layer) => (
          <button
            key={layer.key}
            onClick={() => setActiveLayer(layer.key)}
            className={`px-4 py-2 rounded-full text-xs transition-all ${
              activeLayer === layer.key ? "text-white" : "text-gray-500 hover:text-gray-300"
            }`}
            style={{
              background: activeLayer === layer.key ? `${layerColors[layer.key]}15` : "transparent",
              border:
                activeLayer === layer.key
                  ? `1px solid ${layerColors[layer.key]}40`
                  : "1px solid transparent",
            }}
          >
            <span style={{ color: activeLayer === layer.key ? layerColors[layer.key] : undefined }}>
              {layerIcons[layer.key]}
            </span>{" "}
            {layer.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function OnionVisualizer({
  activeLayer,
  onLayerClick,
}: {
  activeLayer: PersonaLayerKey;
  onLayerClick: (key: PersonaLayerKey) => void;
}) {
  const size = 420;
  const center = size / 2;
  const baseRadius = 180;
  const ringWidth = 18;
  const gap = 3;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(244,114,182,0.1) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <svg width={size} height={size} className="relative z-10">
        <defs>
          {PERSONA_LAYERS.map((layer, i) => (
            <radialGradient key={layer.key} id={`onion-grad-${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={layerColors[layer.key]} stopOpacity="0" />
              <stop offset="100%" stopColor={layerColors[layer.key]} stopOpacity="0.08" />
            </radialGradient>
          ))}
        </defs>

        {[...PERSONA_LAYERS].reverse().map((layer, idx) => {
          const i = PERSONA_LAYERS.length - 1 - idx;
          const radius = baseRadius - i * (ringWidth + gap);
          const isActive = activeLayer === layer.key;
          const color = layerColors[layer.key];

          return (
            <g
              key={layer.key}
              style={{ cursor: "pointer" }}
              onClick={() => onLayerClick(layer.key)}
            >
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill={`url(#onion-grad-${i})`}
                stroke={isActive ? color : "rgba(255,255,255,0.06)"}
                strokeWidth={isActive ? 2 : 1}
                style={{
                  transition: "all 0.3s ease",
                  filter: isActive ? `drop-shadow(0 0 8px ${color}66)` : "none",
                }}
              />
              <text
                x={center}
                y={center - radius + ringWidth / 2 + 4}
                textAnchor="middle"
                className="pointer-events-none select-none"
                style={{
                  fontSize: "10px",
                  fill: isActive ? color : "rgba(156,163,175,0.5)",
                  transition: "all 0.3s ease",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {layer.label}
              </text>
            </g>
          );
        })}

        <circle cx={center} cy={center} r={22} fill="url(#onion-grad-0)" stroke="rgba(244,114,182,0.3)" strokeWidth={1} />
        <text
          x={center}
          y={center - 2}
          textAnchor="middle"
          className="pointer-events-none select-none"
          style={{ fontSize: "11px", fill: "#fce7f3", fontWeight: 500 }}
        >
          灵魂
        </text>
        <text
          x={center}
          y={center + 10}
          textAnchor="middle"
          className="pointer-events-none select-none"
          style={{ fontSize: "8px", fill: "rgba(252,231,243,0.5)" }}
        >
          Core
        </text>
      </svg>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-white">{value}</div>
    </div>
  );
}

function StoryItem({ phase, text }: { phase: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-pink-400/60 mt-1.5" />
        <div className="w-px flex-1 bg-white/5" />
      </div>
      <div className="pb-3">
        <div className="text-xs text-pink-300/80 mb-1">{phase}</div>
        <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function NeedBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-500 font-mono">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}40, ${color})`,
            boxShadow: `0 0 6px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}

function GrowthBar({ label, initial, current }: { label: string; initial: number; current: number }) {
  const growth = current - initial;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-500 font-mono">
          {Math.round(initial)} → <span className="text-emerald-400">{Math.round(current)}</span>
          <span className="text-emerald-500/70 ml-1">+{Math.round(growth)}</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="absolute left-0 top-0 h-full rounded-full bg-white/10" style={{ width: `${initial}%` }} />
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{
            width: `${current}%`,
            background: "linear-gradient(90deg, #f472b6, #a78bfa, #4ade80)",
            boxShadow: "0 0 8px rgba(74, 222, 128, 0.4)",
          }}
        />
      </div>
    </div>
  );
}

function CultureItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-blue-300">{value}</div>
    </div>
  );
}

function TraitsRadar({
  data,
  labels,
  color,
  size = 220,
}: {
  data: number[];
  labels: string[];
  color: string;
  size?: number;
}) {
  const center = size / 2;
  const maxRadius = size / 2 - 30;
  const sides = data.length;

  const points = data.map((value, i) => {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const radius = (value / 100) * maxRadius;
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    };
  });

  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ") + " Z";

  return (
    <svg width={size} height={size}>
      <defs>
        <radialGradient id="radar-grad-traits" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((level, li) => (
        <polygon
          key={li}
          points={Array.from({ length: sides })
            .map((_, i) => {
              const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
              const r = maxRadius * level;
              return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
            })
            .join(" ")}
          fill="none"
          stroke="rgba(103, 232, 249, 0.06)"
          strokeWidth="1"
        />
      ))}

      <path d={pathD} fill="url(#radar-grad-traits)" stroke={color} strokeWidth={2} />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} />
      ))}

      {labels.map((label, i) => {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        const labelR = maxRadius + 16;
        const x = center + Math.cos(angle) * labelR;
        const y = center + Math.sin(angle) * labelR;
        const textAnchor =
          Math.abs(Math.cos(angle)) < 0.2 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            className="text-[10px] fill-gray-400"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function translateKey(key: string): string {
  const map: Record<string, string> = {
    understanding: "被理解",
    recognition: "被认可",
    security: "安全感",
    freedom: "自由",
    connection: "连接感",
    achievement: "成就感",
    growth: "成长",
    contribution: "贡献感",
    power: "权力感",
    belonging: "归属感",
    happiness: "幸福感",
    beauty: "美感",
    love: "被爱",
    truth: "求真",
  };
  return map[key] ?? key;
}

function translateFear(key: string): string {
  const map: Record<string, string> = {
    abandonment: "被抛弃",
    oblivion: "被遗忘",
    failure: "失败",
    rejection: "被拒绝",
    lossOfControl: "失控",
    mediocrity: "平庸",
    betrayal: "背叛",
    vulnerability: "脆弱",
    loneliness: "孤独",
    stagnation: "停滞",
  };
  return map[key] ?? key;
}

function translateValue(key: string): string {
  const map: Record<string, string> = {
    love: "爱情",
    family: "家庭",
    career: "事业",
    wealth: "财富",
    freedom: "自由",
    truth: "真相",
    beauty: "美",
    justice: "正义",
    loyalty: "忠诚",
    health: "健康",
    friendship: "友情",
    security: "安全感",
  };
  return map[key] ?? key;
}
