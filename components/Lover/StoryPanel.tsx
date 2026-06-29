"use client";

import { useMemo } from "react";
import { LifeState, Secret } from "@/lib/core/digital-life";

interface StoryPanelProps {
  lifeState: LifeState;
  onClose?: () => void;
}

const ARC_ICONS: Record<string, string> = {
  introduction: "👋",
  development: "📖",
  conflict: "⚡",
  climax: "🔥",
  resolution: "✨",
  subplot: "🎭",
};

const ARC_COLORS: Record<string, string> = {
  introduction: "from-blue-500/30 to-blue-600/30",
  development: "from-green-500/30 to-emerald-600/30",
  conflict: "from-red-500/30 to-orange-600/30",
  climax: "from-yellow-500/30 to-amber-600/30",
  resolution: "from-purple-500/30 to-pink-600/30",
  subplot: "from-gray-500/30 to-gray-600/30",
};

const SECRET_ICONS: Record<string, string> = {
  wish: "🌟",
  crush: "💕",
  fear: "😰",
  plan: "📝",
  memory: "💭",
  desire: "✨",
};

const SECRET_LABELS: Record<string, string> = {
  wish: "心愿",
  crush: "暗恋",
  fear: "担忧",
  plan: "秘密计划",
  memory: "珍贵回忆",
  desire: "渴望",
};

const PHASE_LABELS: Record<string, string> = {
  locked: "🔒 未解锁",
  available: "📍 可进行",
  active: "⭐ 进行中",
  completed: "✅ 已完成",
  failed: "❌ 未完成",
};

export default function StoryPanel({ lifeState, onClose }: StoryPanelProps) {
  const storyLine = lifeState.storyLine;
  const arcs = storyLine?.storyArcs || [];
  const secrets = storyLine?.secrets || [];
  const narrative = storyLine?.activeNarrative;

  const unlockedArcs = useMemo(() => arcs.filter(a => a.status !== "locked"), [arcs]);
  const activeArc = useMemo(() => arcs.find(a => a.status === "active"), [arcs]);
  const completedArcs = useMemo(() => arcs.filter(a => a.status === "completed"), [arcs]);
  const revealedSecrets = useMemo(() => secrets.filter(s => s.isRevealed), [secrets]);
  const hiddenSecrets = useMemo(() => secrets.filter(s => !s.isRevealed), [secrets]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white/90">我们的故事</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Narrative Overview */}
        {narrative && (
          <section className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
              <span>📚</span> {narrative.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span>第{narrative.currentChapter}章</span>
              <span className="text-white/40">/</span>
              <span>共{narrative.totalChapters}章</span>
            </div>
            <div className="text-xs text-white/50 mt-1">{narrative.summary}</div>
          </section>
        )}

        {/* Story Arcs */}
        <section>
          <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
            <span>🎬</span> 故事章节
          </h3>
          <div className="space-y-3">
            {arcs.map((arc, index) => (
              <ArcCard
                key={arc.id || index}
                arc={arc}
                isActive={arc.status === "active"}
                isLocked={arc.status === "locked"}
              />
            ))}
          </div>
        </section>

        {/* Progress Stats */}
        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
            <span>📊</span> 故事进度
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-xl font-bold text-white">{completedArcs.length}</div>
              <div className="text-xs text-white/50">已完成</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-400">{unlockedArcs.length}</div>
              <div className="text-xs text-white/50">已解锁</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{arcs.length - unlockedArcs.length}</div>
              <div className="text-xs text-white/50">未解锁</div>
            </div>
          </div>
        </section>

        {/* Secrets Section */}
        <section>
          <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
            <span>🤫</span> 她的秘密
            <span className="text-xs text-white/40">({revealedSecrets.length}/{secrets.length})</span>
          </h3>

          {/* Revealed Secrets */}
          {revealedSecrets.length > 0 && (
            <div className="space-y-2 mb-4">
              <div className="text-xs text-white/40 uppercase">已揭示</div>
              {revealedSecrets.map((secret, index) => (
                <SecretCard key={secret.id || index} secret={secret} revealed />
              ))}
            </div>
          )}

          {/* Hidden Secrets */}
          {hiddenSecrets.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-white/40 uppercase">尚未揭示</div>
              {hiddenSecrets.slice(0, 3).map((secret, index) => (
                <SecretCard key={secret.id || index} secret={secret} revealed={false} />
              ))}
              {hiddenSecrets.length > 3 && (
                <div className="text-center py-2 text-sm text-white/40">
                  还有 {hiddenSecrets.length - 3} 个秘密...
                </div>
              )}
            </div>
          )}
        </section>

        {/* Current Arc Detail */}
        {activeArc && (
          <section className="bg-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
              <span>📍</span> 当前章节详情
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">{ARC_ICONS[activeArc.type]}</div>
              <div>
                <div className="font-medium text-white">{activeArc.title}</div>
                <div className="text-sm text-white/60">{activeArc.description}</div>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">章节进度</span>
                <span className="text-white/80">{Math.round(activeArc.progress)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                  style={{ width: `${activeArc.progress}%` }}
                />
              </div>
            </div>

            {/* Key Moments */}
            <div>
              <div className="text-xs text-white/60 mb-2">关键时刻</div>
              <div className="space-y-1">
                {activeArc.keyMoments.map((moment, index) => (
                  <div
                    key={index}
                    className={`text-sm flex items-center gap-2 ${
                      index < activeArc.currentMoment
                        ? "text-white/80"
                        : "text-white/40"
                    }`}
                  >
                    <span>{index < activeArc.currentMoment ? "✓" : "○"}</span>
                    <span>{moment}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ArcCard({ arc, isActive, isLocked }: { arc: any; isActive: boolean; isLocked: boolean }) {
  return (
    <div
      className={`rounded-xl p-4 ${
        isLocked
          ? "bg-white/5 opacity-60"
          : isActive
          ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"
          : "bg-white/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`text-2xl ${isLocked ? "grayscale opacity-50" : ""}`}>
          {ARC_ICONS[arc.type] || "📖"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm px-2 py-0.5 rounded ${
              isLocked
                ? "bg-white/10 text-white/40"
                : isActive
                ? "bg-purple-500/30 text-purple-300"
                : "bg-green-500/30 text-green-300"
            }`}>
              {PHASE_LABELS[arc.status]}
            </span>
          </div>
          <div className={`font-medium mt-1 ${isLocked ? "text-white/40" : "text-white/90"}`}>
            {arc.title}
          </div>
          <div className={`text-sm mt-1 ${isLocked ? "text-white/30" : "text-white/50"}`}>
            {arc.description}
          </div>
          {!isLocked && (
            <div className="mt-2">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  style={{ width: `${arc.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SecretCard({ secret, revealed }: { secret: Secret; revealed: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${revealed ? "bg-white/5" : "bg-white/5 opacity-60"}`}>
      <div className="flex items-start gap-2">
        <div className="text-lg">{revealed ? SECRET_ICONS[secret.type] || "🤫" : "❓"}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              revealed ? "bg-white/10 text-white/60" : "bg-white/5 text-white/40"
            }`}>
              {SECRET_LABELS[secret.type] || secret.type}
            </span>
          </div>
          <div className={`text-sm mt-1 ${revealed ? "text-white/80" : "text-white/40"}`}>
            {revealed ? secret.content : "这是一个秘密..."}
          </div>
          {revealed && secret.revealedAt && (
            <div className="text-xs text-white/40 mt-1">
              {new Date(secret.revealedAt).getMonth() + 1}月{new Date(secret.revealedAt).getDate()}日揭示
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
