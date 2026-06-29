"use client";

import { useMemo } from "react";
import { LifeState, Milestone, SharedMemory } from "@/lib/core/digital-life";

interface RelationshipTimelineProps {
  lifeState: LifeState;
  onClose?: () => void;
}

const MILESTONE_ICONS: Record<string, string> = {
  first_meeting: "🤝",
  first_chat: "💬",
  first_confession: "💌",
  first_hug: "🤗",
  first_kiss: "💋",
  first_date: "📅",
  first_argue: "😤",
  first_apology: "🙏",
  first_gift: "🎁",
  night_talk: "🌙",
  streak_3_days: "🔥",
  streak_7_days: "🔥",
  streak_30_days: "⭐",
  streak_100_days: "💫",
  streak_365_days: "🌟",
  milestone_30_days: "📅",
  milestone_100_days: "💕",
  milestone_365_days: "💖",
  relationship_upgrade: "⬆️",
  deep_conversation: "💭",
  share_secrets: "🤫",
  trust_deepened: "🔐",
  first_reconciliation: "🤝",
  shared_creativity: "🎨",
  mutual_support: "🤝",
  inside_joke: "😄",
  default: "✨",
};

const RARITY_COLORS: Record<number, string> = {
  1: "border-white/20",
  2: "border-green-500/50",
  3: "border-blue-500/50",
  4: "border-purple-500/50",
  5: "border-yellow-500/50",
};

export default function RelationshipTimeline({ lifeState, onClose }: RelationshipTimelineProps) {
  const timeline = lifeState.relationshipTimeline;
  const milestones = timeline?.milestones || [];
  const sharedMemories = timeline?.sharedMemories || [];
  const history = timeline?.history || [];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "今天";
    if (days === 1) return "昨天";
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    return `${Math.floor(days / 30)}月前`;
  };

  const phaseLabels: Record<string, { name: string; desc: string }> = {
    acquaintance: { name: "初识", desc: "刚刚相遇的美好" },
    exploration: { name: "探索", desc: "慢慢了解彼此" },
    growth: { name: "成长", desc: "关系逐渐加深" },
    deepening: { name: "深化", desc: "彼此更加亲密" },
    mature: { name: "成熟", desc: "稳定而深厚的感情" },
  };

  const currentPhase = timeline?.currentPhase || "acquaintance";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white/90">关系历程</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Stats Overview */}
        <div className="p-4 border-b border-white/5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{timeline?.totalDaysTogether || 1}</div>
              <div className="text-xs text-white/60">认识天数</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{timeline?.currentStreak || 1}</div>
              <div className="text-xs text-white/60">连续天数</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{milestones.length}</div>
              <div className="text-xs text-white/60">里程碑</div>
            </div>
          </div>

          {/* Current Phase */}
          <div className="mt-4 bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60">关系阶段</span>
              <span className="text-lg font-medium text-white">{phaseLabels[currentPhase]?.name}</span>
            </div>
            <div className="flex gap-1">
              {Object.keys(phaseLabels).map((phase, index) => (
                <div
                  key={phase}
                  className={`flex-1 h-1.5 rounded-full ${
                    Object.keys(phaseLabels).indexOf(currentPhase) >= index
                      ? "bg-gradient-to-r from-pink-500 to-rose-500"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-white/40 mt-2">{phaseLabels[currentPhase]?.desc}</div>
          </div>
        </div>

        {/* Milestones */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
            <span>🏆</span> 里程碑
          </h3>

          {milestones.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <div className="text-4xl mb-2">🌱</div>
              <div>还没有解锁里程碑</div>
              <div className="text-xs mt-1">继续和她互动吧</div>
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <MilestoneCard key={milestone.id || index} milestone={milestone} />
              ))}
            </div>
          )}
        </div>

        {/* Shared Memories */}
        {sharedMemories.length > 0 && (
          <div className="p-4 border-t border-white/5">
            <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
              <span>📖</span> 共同回忆
            </h3>
            <div className="space-y-3">
              {sharedMemories.slice(0, 5).map((memory, index) => (
                <MemoryCard key={memory.id || index} memory={memory} />
              ))}
            </div>
          </div>
        )}

        {/* Recent History */}
        {history.length > 0 && (
          <div className="p-4 border-t border-white/5">
            <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
              <span>📜</span> 最近事件
            </h3>
            <div className="space-y-2">
              {history.slice(-10).reverse().map((event, index) => (
                <div key={event.id || index} className="flex items-start gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm flex-shrink-0">
                    {MILESTONE_ICONS[event.eventType] || MILESTONE_ICONS.default}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/80 truncate">{event.event}</div>
                    <div className="text-xs text-white/40">{formatTimeAgo(event.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className={`bg-white/5 rounded-xl p-4 border-l-4 ${RARITY_COLORS[milestone.importance] || RARITY_COLORS[1]}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{MILESTONE_ICONS[milestone.type] || MILESTONE_ICONS.default}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white">{milestone.title}</div>
          <div className="text-sm text-white/60 mt-1">{milestone.description}</div>
          <div className="text-xs text-white/40 mt-2">
            {formatDate(milestone.timestamp)}
            {milestone.importance >= 3 && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                {milestone.importance === 3 ? "稀有" :
                 milestone.importance === 4 ? "珍贵" :
                 milestone.importance === 5 ? "史诗" : ""}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MemoryCard({ memory }: { memory: SharedMemory }) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <div className="flex items-start gap-2">
        <div className="text-lg">📸</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white">{memory.title}</div>
          <div className="text-xs text-white/60 mt-1 line-clamp-2">{memory.summary}</div>
          <div className="flex flex-wrap gap-1 mt-2">
            {memory.tags?.slice(0, 3).map((tag, index) => (
              <span key={index} className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
