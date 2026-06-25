"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ARCHETYPES,
  PERSONA_LAYERS,
  getArchetypeName,
  getPersonaSummary,
  calculatePersonaSimilarity,
  simulateGrowth,
  type DigitalPersona,
  type PersonaLayerKey,
  type ArchetypeId,
  type GrowthMetrics,
} from "@/data/persona";
import { AGENT_PERSONAS } from "@/data/agent-personas";
import type { AgentId } from "@/data/agents";

function ProgressBar({ value, label, color = "#22d3ee" }: { value: number; label: string; color?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300 font-mono">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: `linear-gradient(90deg, ${color}00, ${color}, ${color}ff)`,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}

function RadarChart({
  data,
  labels,
  color = "#22d3ee",
  size = 220,
}: {
  data: number[];
  labels: string[];
  color?: string;
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
      labelX: center + Math.cos(angle) * (maxRadius + 18),
      labelY: center + Math.sin(angle) * (maxRadius + 18),
    };
  });

  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ") + " Z";

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} className="block mx-auto">
      <defs>
        <radialGradient id={`radar-grad-${color.replace("#", "")}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {gridLevels.map((level, li) => (
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
          stroke="rgba(103, 232, 249, 0.08)"
          strokeWidth="1"
        />
      ))}

      {Array.from({ length: sides }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + Math.cos(angle) * maxRadius}
            y2={center + Math.sin(angle) * maxRadius}
            stroke="rgba(103, 232, 249, 0.06)"
            strokeWidth="1"
          />
        );
      })}

      <path
        d={pathD}
        fill={`url(#radar-grad-${color.replace("#", "")})`}
        stroke={color}
        strokeWidth="2"
        style={{
          filter: `drop-shadow(0 0 6px ${color}66)`,
        }}
      />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      ))}

      {labels.map((label, i) => {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
        const textAnchor = Math.abs(Math.cos(angle)) < 0.2 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
        const dy = Math.abs(Math.sin(angle)) < 0.2 ? (Math.sin(angle) >= 0 ? "1em" : "-0.3em") : "0.3em";
        return (
          <text
            key={i}
            x={points[i].labelX}
            y={points[i].labelY}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            dy={dy}
            className="text-[10px] fill-gray-400"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function LayerConcentricCircle({
  layers,
  activeLayer,
  onLayerClick,
}: {
  layers: typeof PERSONA_LAYERS;
  activeLayer: PersonaLayerKey | null;
  onLayerClick: (key: PersonaLayerKey) => void;
}) {
  const baseRadius = 180;
  const ringWidth = 20;
  const gap = 4;
  const size = baseRadius * 2 + 40;
  const center = size / 2;

  return (
    <svg width={size} height={size} className="block mx-auto">
      <defs>
        {layers.map((layer, i) => {
          const color = getLayerColor(layer.key);
          return (
            <radialGradient key={layer.key} id={`ring-grad-${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </radialGradient>
          );
        })}
      </defs>

      {[...layers].reverse().map((layer, idx) => {
        const i = layers.length - 1 - idx;
        const innerR = 30 + i * (ringWidth + gap);
        const outerR = innerR + ringWidth;
        const isActive = activeLayer === layer.key;
        const color = getLayerColor(layer.key);

        return (
          <g key={layer.key} style={{ cursor: "pointer" }} onClick={() => onLayerClick(layer.key)}>
            <circle
              cx={center}
              cy={center}
              r={outerR}
              fill={`url(#ring-grad-${i})`}
              stroke={isActive ? color : "rgba(103, 232, 249, 0.1)"}
              strokeWidth={isActive ? 2 : 1}
              style={{
                transition: "all 0.3s ease",
                filter: isActive ? `drop-shadow(0 0 12px ${color}88)` : "none",
              }}
            />
            <circle
              cx={center}
              cy={center}
              r={innerR}
              fill="#030712"
              stroke="none"
            />
            <text
              x={center}
              y={center - outerR + ringWidth / 2 + 4}
              textAnchor="middle"
              className="text-[10px] fill-gray-400 pointer-events-none"
              style={{
                fill: isActive ? color : undefined,
                transition: "all 0.3s ease",
              }}
            >
              {layer.label}
            </text>
          </g>
        );
      })}

      <text x={center} y={center - 5} textAnchor="middle" className="text-sm font-semibold fill-white">
        人格核心
      </text>
      <text x={center} y={center + 12} textAnchor="middle" className="text-[10px] fill-gray-500">
        9 层结构
      </text>
    </svg>
  );
}

function getLayerColor(key: PersonaLayerKey): string {
  const colors: Record<PersonaLayerKey, string> = {
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
  return colors[key] ?? "#22d3ee";
}

function GrowthTimeline({ persona }: { persona: DigitalPersona }) {
  const metrics: (keyof GrowthMetrics)[] = [
    "confidence",
    "expressiveness",
    "independence",
    "emotionalAwareness",
    "socialSkills",
    "resilience",
  ];

  const labels = {
    confidence: "自信",
    expressiveness: "表达欲",
    independence: "独立性",
    emotionalAwareness: "情绪觉察",
    socialSkills: "社交能力",
    resilience: "韧性",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-gray-500">初始状态</span>
        <span className="text-brand-400">成长</span>
        <span className="text-gray-500">当前状态</span>
      </div>
      {metrics.map((key) => {
        const initial = persona.growth.initial[key];
        const current = persona.growth.current[key];
        const growth = current - initial;
        return (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">{labels[key]}</span>
              <span className="text-gray-500 font-mono">
                {Math.round(initial)} → <span className="text-emerald-400">{Math.round(current)}</span>
                <span className={growth >= 0 ? "text-emerald-500/70 ml-1" : "text-red-500/70 ml-1"}>
                  ({growth >= 0 ? "+" : ""}{Math.round(growth)})
                </span>
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-white/10"
                style={{ width: `${initial}%` }}
              />
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                style={{
                  width: `${current}%`,
                  background: "linear-gradient(90deg, #22d3ee, #4ade80)",
                  boxShadow: "0 0 8px rgba(74, 222, 128, 0.4)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PersonaLab() {
  const [activeTab, setActiveTab] = useState<"archetypes" | "agents">("agents");
  const [selectedPersona, setSelectedPersona] = useState<DigitalPersona | null>(null);
  const [activeLayer, setActiveLayer] = useState<PersonaLayerKey | null>("identity");
  const [growthMonths, setGrowthMonths] = useState(12);

  const personas = useMemo(() => {
    if (activeTab === "agents") {
      return Object.entries(AGENT_PERSONAS).map(([id, persona]) => ({ id, persona }));
    }
    return ARCHETYPES.map((a) => ({
      id: a.id,
      archetype: a,
    }));
  }, [activeTab]);

  useEffect(() => {
    if (personas.length > 0 && !selectedPersona) {
      const first = personas[0];
      if ("persona" in first) {
        setSelectedPersona(first.persona);
      }
    }
  }, [personas, selectedPersona, activeTab]);

  const handlePersonaClick = (item: (typeof personas)[number]) => {
    if ("persona" in item) {
      setSelectedPersona(item.persona);
    }
  };

  if (!selectedPersona) return null;

  const traitsData = [
    selectedPersona.traits.openness,
    selectedPersona.traits.conscientiousness,
    selectedPersona.traits.extraversion,
    selectedPersona.traits.agreeableness,
    100 - selectedPersona.traits.neuroticism,
  ];
  const traitsLabels = ["开放性", "责任心", "外向度", "宜人性", "情绪稳定"];

  const needsEntries = Object.entries(selectedPersona.needs)
    .filter(([_, v]) => typeof v === "number")
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 6);

  const fearsEntries = Object.entries(selectedPersona.fears)
    .filter(([k, v]) => k !== "specificFears" && typeof v === "number")
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 6);

  const valuesEntries = Object.entries(selectedPersona.values)
    .filter(([_, v]) => typeof v === "number")
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 6);

  const needLabels: Record<string, string> = {
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

  const fearLabels: Record<string, string> = {
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

  const valueLabels: Record<string, string> = {
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

  const attachmentLabels = {
    secure: "安全型",
    anxious: "焦虑型",
    avoidant: "回避型",
    disorganized: "混乱型",
  };

  const archetypeInfo = ARCHETYPES.find((a) => a.id === selectedPersona.archetype);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-24">
      <div className="mb-12 text-center">
        <div className="mb-3 text-xs uppercase tracking-[0.25em] text-brand-400">Digital Life Lab</div>
        <h2 className="text-3xl font-semibold text-white md:text-4xl">
          <span className="text-gradient-brand">数字生命人格实验室</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-400 md:text-base">
          人设 = 身份 + 经历 + 需求 + 恐惧 + 价值观 + 人格 + 关系模式 + 文化 + 成长轨迹
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.02] p-1">
          <button
            onClick={() => setActiveTab("agents")}
            className={`px-6 py-2 rounded-full text-sm transition-all ${
              activeTab === "agents"
                ? "bg-brand-400/20 text-brand-300 border border-brand-400/30"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            10 位 AI 专家
          </button>
          <button
            onClick={() => setActiveTab("archetypes")}
            className={`px-6 py-2 rounded-full text-sm transition-all ${
              activeTab === "archetypes"
                ? "bg-brand-400/20 text-brand-300 border border-brand-400/30"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            20 个人格原型
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-3 max-h-[700px] overflow-y-auto pr-2 scroll-mask-top">
          {personas.map((item, idx) => {
            const persona = "persona" in item ? item.persona : null;
            const archetype = "archetype" in item ? item.archetype : null;
            const name = persona?.identity.name ?? archetype?.name ?? "";
            const role = persona?.identity.occupation ?? archetype?.tagline ?? "";
            const isActive = selectedPersona.id === (persona?.id ?? archetype?.id);
            const archColor = getLayerColor("traits");

            return (
              <button
                key={item.id}
                onClick={() => handlePersonaClick(item)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isActive
                    ? "border-brand-400/40 bg-brand-400/5"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                }`}
                style={{
                  animation: `slideUp 0.5s ease-out ${idx * 30}ms both`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${archColor}, ${archColor}88)`,
                      boxShadow: `0 0 12px ${archColor}44`,
                    }}
                  >
                    {name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{name}</div>
                    <div className="text-xs text-gray-500 truncate">{role}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedPersona.identity.name}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedPersona.identity.age}岁 · {selectedPersona.identity.city} ·{" "}
                  {getArchetypeName(selectedPersona.archetype)}
                </p>
              </div>
              <div
                className="px-3 py-1 rounded-full text-xs border"
                style={{
                  borderColor: "rgba(34, 211, 238, 0.3)",
                  background: "rgba(34, 211, 238, 0.1)",
                  color: "#22d3ee",
                }}
              >
                {getArchetypeName(selectedPersona.archetype)}原型
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              {getPersonaSummary(selectedPersona)}
            </p>

            <div className="flex justify-center mb-4">
              <LayerConcentricCircle
                layers={PERSONA_LAYERS}
                activeLayer={activeLayer}
                onLayerClick={setActiveLayer}
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {PERSONA_LAYERS.map((layer) => (
                <button
                  key={layer.key}
                  onClick={() => setActiveLayer(layer.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    activeLayer === layer.key
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                  style={{
                    background: activeLayer === layer.key ? `${getLayerColor(layer.key)}22` : "transparent",
                    borderColor: activeLayer === layer.key ? `${getLayerColor(layer.key)}44` : "transparent",
                    borderWidth: "1px",
                  }}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          {activeLayer === "identity" && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: getLayerColor("identity") }} />
                身份层 · 用户看到的外壳
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">姓名</div>
                  <div className="text-sm text-white">{selectedPersona.identity.name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">年龄</div>
                  <div className="text-sm text-white">{selectedPersona.identity.age}岁</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">职业</div>
                  <div className="text-sm text-white">{selectedPersona.identity.occupation}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">城市</div>
                  <div className="text-sm text-white">{selectedPersona.identity.city}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">生日</div>
                  <div className="text-sm text-white">{selectedPersona.identity.birthday}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">原型</div>
                  <div className="text-sm text-white">{getArchetypeName(selectedPersona.archetype)}</div>
                </div>
              </div>
            </div>
          )}

          {activeLayer === "backstory" && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: getLayerColor("backstory") }} />
                经历层 · 决定人格来源
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">童年</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedPersona.backstory.childhood}</p>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">高中</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedPersona.backstory.teenage}</p>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">大学</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedPersona.backstory.university}</p>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">毕业后</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedPersona.backstory.postGraduation}</p>
                </div>
                {selectedPersona.backstory.keyTrauma && (
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <div className="text-xs text-red-400 mb-1">关键创伤</div>
                    <p className="text-sm text-gray-300">{selectedPersona.backstory.keyTrauma}</p>
                  </div>
                )}
                {selectedPersona.backstory.keyVictory && (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="text-xs text-emerald-400 mb-1">关键成就</div>
                    <p className="text-sm text-gray-300">{selectedPersona.backstory.keyVictory}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeLayer === "needs" && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: getLayerColor("needs") }} />
                需求层 · 行为的驱动力
              </h4>
              <div className="space-y-3">
                {needsEntries.map(([key, value]) => (
                  <ProgressBar
                    key={key}
                    value={value as number}
                    label={needLabels[key] ?? key}
                    color={getLayerColor("needs")}
                  />
                ))}
              </div>
            </div>
          )}

          {activeLayer === "fears" && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: getLayerColor("fears") }} />
                恐惧层 · 逃避行为的根源
              </h4>
              <div className="space-y-3 mb-4">
                {fearsEntries.map(([key, value]) => (
                  <ProgressBar
                    key={key}
                    value={value as number}
                    label={fearLabels[key] ?? key}
                    color={getLayerColor("fears")}
                  />
                ))}
              </div>
              {selectedPersona.fears.specificFears.length > 0 && (
                <div className="pt-3 border-t border-white/5">
                  <div className="text-xs text-gray-500 mb-2">具体恐惧</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPersona.fears.specificFears.map((fear, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-md text-xs text-red-300 bg-red-500/10 border border-red-500/20"
                      >
                        {fear}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeLayer === "values" && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: getLayerColor("values") }} />
                价值观层 · 判断好坏的标准
              </h4>
              <div className="space-y-3">
                {valuesEntries.map(([key, value]) => (
                  <ProgressBar
                    key={key}
                    value={value as number}
                    label={valueLabels[key] ?? key}
                    color={getLayerColor("values")}
                  />
                ))}
              </div>
            </div>
          )}

          {activeLayer === "traits" && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: getLayerColor("traits") }} />
                人格层 · 稳定的行为模式
              </h4>
              <RadarChart data={traitsData} labels={traitsLabels} color={getLayerColor("traits")} size={220} />
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {selectedPersona.traits.additionalTraits.map((trait, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-xs"
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
          )}

          {activeLayer === "attachment" && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: getLayerColor("attachment") }} />
                关系层 · 亲密关系中的模式
              </h4>
              <div
                className="p-4 rounded-xl border mb-4"
                style={{
                  borderColor: "rgba(251, 146, 60, 0.2)",
                  background: "rgba(251, 146, 60, 0.05)",
                }}
              >
                <div className="text-lg font-semibold text-white mb-1">
                  {attachmentLabels[selectedPersona.attachment.style]}
                </div>
                <p className="text-sm text-gray-400">{selectedPersona.attachment.description}</p>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-gray-500 mb-2">行为模式</div>
                {selectedPersona.attachment.behavioralPatterns.map((pattern, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-orange-400 mt-0.5">·</span>
                    {pattern}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeLayer === "culture" && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: getLayerColor("culture") }} />
                文化层 · 表达方式的底色
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">文化背景</div>
                    <div className="text-sm text-white">
                      {selectedPersona.culture.background === "eastern"
                        ? "东方"
                        : selectedPersona.culture.background === "western"
                        ? "西方"
                        : selectedPersona.culture.background === "cosmopolitan"
                        ? "世界主义"
                        : selectedPersona.culture.background}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">审美偏好</div>
                    <div className="text-sm text-white">
                      {selectedPersona.culture.aesthetic === "minimalist"
                        ? "极简"
                        : selectedPersona.culture.aesthetic === "ethereal"
                        ? "空灵"
                        : selectedPersona.culture.aesthetic === "cyberpunk"
                        ? "赛博朋克"
                        : selectedPersona.culture.aesthetic === "organic"
                        ? "有机"
                        : selectedPersona.culture.aesthetic}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">哲学倾向</div>
                    <div className="text-sm text-white">
                      {selectedPersona.culture.philosophy === "stoicism"
                        ? "斯多葛"
                        : selectedPersona.culture.philosophy === "existentialism"
                        ? "存在主义"
                        : selectedPersona.culture.philosophy === "taoism"
                        ? "道家"
                        : selectedPersona.culture.philosophy === "zen"
                        ? "禅宗"
                        : selectedPersona.culture.philosophy === "longtermism"
                        ? "长期主义"
                        : selectedPersona.culture.philosophy}
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/5">
                  <div className="text-xs text-gray-500 mb-2">表达方式</div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {selectedPersona.culture.expressionStyle}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeLayer === "growth" && (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
              <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: getLayerColor("growth") }} />
                成长层 · 进化的可能性
              </h4>
              <GrowthTimeline persona={selectedPersona} />

              <div className="mt-6 pt-4 border-t border-white/5">
                <div className="text-xs text-gray-500 mb-3">成长模拟</div>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={growthMonths}
                    onChange={(e) => setGrowthMonths(parseInt(e.target.value))}
                    className="flex-1 h-1 rounded-full bg-white/10 accent-emerald-500"
                  />
                  <span className="text-sm text-emerald-400 font-mono w-12 text-right">
                    {growthMonths}月
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {growthMonths}个月后，自信度将从 {selectedPersona.growth.current.confidence.toFixed(0)} →{" "}
                  <span className="text-emerald-400">
                    {simulateGrowth(selectedPersona, growthMonths).confidence.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
