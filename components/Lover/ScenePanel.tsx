"use client";

import { useState, useMemo } from "react";
import {
  SCENE_CONFIGS,
  LIGHTING_CONFIGS,
  COSTUME_CONFIGS,
  SceneId,
  TimeOfDay,
  CostumeConfig,
  getTimeOfDayFromDate,
  getUnlockedCostumes,
} from "@/lib/core/scene-system";

interface ScenePanelProps {
  currentScene: SceneId;
  onSceneChange: (scene: SceneId) => void;
  currentTimeOfDay: TimeOfDay;
  onTimeChange: (time: TimeOfDay) => void;
  autoTimeMode: boolean;
  onAutoTimeToggle: (auto: boolean) => void;
}

export function ScenePanel({
  currentScene,
  onSceneChange,
  currentTimeOfDay,
  onTimeChange,
  autoTimeMode,
  onAutoTimeToggle,
}: ScenePanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-2">🎬 场景选择</h3>
        <div className="grid grid-cols-2 gap-2">
          {SCENE_CONFIGS.map((scene) => (
            <button
              key={scene.id}
              onClick={() => onSceneChange(scene.id)}
              className={`relative p-3 rounded-xl text-left transition-all ${
                currentScene === scene.id
                  ? "ring-2 ring-pink-400 bg-white/10"
                  : "bg-white/5 hover:bg-white/8"
              }`}
            >
              <div className="text-2xl mb-1">{scene.emoji}</div>
              <div className="text-xs font-medium text-white/90">{scene.name}</div>
              <div className="text-[10px] text-white/50 mt-0.5">{scene.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white/80">🌅 时间光影</h3>
          <button
            onClick={() => onAutoTimeToggle(!autoTimeMode)}
            className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
              autoTimeMode
                ? "bg-green-500/30 text-green-300"
                : "bg-white/10 text-white/50"
            }`}
          >
            {autoTimeMode ? "自动同步" : "手动"}
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(Object.keys(LIGHTING_CONFIGS) as TimeOfDay[]).map((time) => {
            const config = LIGHTING_CONFIGS[time];
            const isActive = currentTimeOfDay === time;
            return (
              <button
                key={time}
                onClick={() => {
                  onTimeChange(time);
                  onAutoTimeToggle(false);
                }}
                disabled={autoTimeMode}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-center transition-all min-w-[60px] ${
                  isActive
                    ? "ring-2 ring-blue-400 bg-white/10"
                    : "bg-white/5 hover:bg-white/8"
                } ${autoTimeMode ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <div className="text-lg">{config.emoji}</div>
                <div className="text-[10px] text-white/70 mt-0.5">{config.name}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface CostumePanelProps {
  currentCostume: string;
  onCostumeChange: (costumeId: string) => void;
  userLevel: number;
  ownedPremium: string[];
}

export function CostumePanel({
  currentCostume,
  onCostumeChange,
  userLevel,
  ownedPremium,
}: CostumePanelProps) {
  const [filter, setFilter] = useState<"all" | "casual" | "formal" | "special" | "seasonal">("all");

  const costumes = useMemo(() => {
    const filtered = filter === "all"
      ? COSTUME_CONFIGS
      : COSTUME_CONFIGS.filter(c => c.category === filter);
    return filtered;
  }, [filter]);

  const unlockedIds = useMemo(() =>
    getUnlockedCostumes(userLevel, ownedPremium).map(c => c.id),
    [userLevel, ownedPremium]
  );

  const categoryLabels: Record<string, string> = {
    all: "全部",
    casual: "休闲",
    formal: "正式",
    special: "特殊",
    seasonal: "季节限定",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/80">👗 服装衣柜</h3>
        <span className="text-[10px] text-white/40">Lv.{userLevel} 已解锁 {unlockedIds.length}/{COSTUME_CONFIGS.length}</span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] transition-colors ${
              filter === key
                ? "bg-pink-500/30 text-pink-200"
                : "bg-white/5 text-white/50 hover:bg-white/8"
            }`}
          >
            {categoryLabels[key]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {costumes.map((costume) => {
          const isUnlocked = unlockedIds.includes(costume.id);
          const isCurrent = currentCostume === costume.id;

          return (
            <button
              key={costume.id}
              onClick={() => isUnlocked && onCostumeChange(costume.id)}
              disabled={!isUnlocked}
              className={`relative p-3 rounded-xl text-left transition-all overflow-hidden ${
                isCurrent
                  ? "ring-2 ring-pink-400 bg-white/10"
                  : isUnlocked
                  ? "bg-white/5 hover:bg-white/8"
                  : "bg-white/3 opacity-40 cursor-not-allowed"
              }`}
            >
              <div
                className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20"
                style={{ background: costume.previewColor }}
              />
              <div className="text-2xl mb-1 relative">{costume.emoji}</div>
              <div className="text-xs font-medium text-white/90 relative">{costume.name}</div>
              <div className="text-[10px] text-white/50 mt-0.5 relative">{costume.description}</div>

              <div className="flex items-center gap-1 mt-2 relative">
                {costume.isPremium && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200">
                    💎 Premium
                  </span>
                )}
                {isUnlocked ? (
                  isCurrent && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/30 text-pink-200">
                      当前
                    </span>
                  )
                ) : (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/40">
                    🔒 Lv.{costume.unlockLevel}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SceneControlBar({
  scene,
  timeOfDay,
  onOpenPanel,
}: {
  scene: SceneId;
  timeOfDay: TimeOfDay;
  onOpenPanel: () => void;
}) {
  const sceneConfig = SCENE_CONFIGS.find(s => s.id === scene);
  const timeConfig = LIGHTING_CONFIGS[timeOfDay];

  return (
    <button
      onClick={onOpenPanel}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/15 transition-colors"
    >
      <span className="text-sm">{sceneConfig?.emoji}</span>
      <span className="text-[11px] text-white/70">{sceneConfig?.name}</span>
      <span className="text-white/20">|</span>
      <span className="text-sm">{timeConfig.emoji}</span>
      <span className="text-[11px] text-white/70">{timeConfig.name}</span>
    </button>
  );
}
