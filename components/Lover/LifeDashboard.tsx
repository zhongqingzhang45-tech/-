"use client";

import { useMemo } from "react";
import { LifeState } from "@/lib/core/digital-life";

interface LifeDashboardProps {
  lifeState: LifeState;
  onClose?: () => void;
}

const MOOD_EMOJIS: Record<string, string> = {
  neutral: "😐",
  happy: "😊",
  excited: "🤩",
  shy: "😳",
  love: "🥰",
  sad: "😢",
  angry: "😠",
  jealous: "😒",
  sleepy: "😴",
};

const TIME_ICONS: Record<string, string> = {
  dawn: "🌅",
  morning: "☀️",
  noon: "🌤️",
  afternoon: "🌤️",
  evening: "🌆",
  night: "🌙",
  midnight: "🌑",
};

const PHASE_ICONS: Record<string, string> = {
  acquaintance: "👋",
  exploration: "🔍",
  growth: "📈",
  deepening: "💕",
  mature: "✨",
};

export default function LifeDashboard({ lifeState, onClose }: LifeDashboardProps) {
  const { perception, emotion, body, instinct, relationship, growth, worldView, economy, inventory } = lifeState;

  const timeOfDay = perception.environmentContext?.timePhase || "morning";
  const getRelationshipPhase = (intimacy: number): string => {
    if (intimacy >= 180) return "soulmate";
    if (intimacy >= 140) return "deep_bond";
    if (intimacy >= 100) return "committed";
    if (intimacy >= 60) return "comfortable";
    if (intimacy >= 30) return "close";
    return "acquaintance";
  };
  const currentPhase = getRelationshipPhase(relationship.intimacy);
  const currentMood = emotion.mood || "neutral";

  const intimacyLevel = Math.floor(relationship.intimacy / 20);
  const trustLevel = Math.floor(relationship.trust / 20);
  const attractionLevel = Math.floor(relationship.attraction / 20);

  const levelProgress = growth.experience % 100;
  const totalDays = relationship.streakDays || 1;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white/90">生命状态</h2>
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
        {/* Time & Environment */}
        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
            <span>🌍</span> 环境感知
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{TIME_ICONS[timeOfDay]}</span>
              <div>
                <div className="text-sm text-white/80 capitalize">{timeOfDay}</div>
                <div className="text-xs text-white/40">
                  {perception.dayOfWeek !== undefined ? `周${["日", "一", "二", "三", "四", "五", "六"][perception.dayOfWeek]}` : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{PHASE_ICONS[currentPhase]}</span>
              <div>
                <div className="text-sm text-white/80 capitalize">
                  {currentPhase === "acquaintance" ? "初识" :
                   currentPhase === "exploration" ? "探索" :
                   currentPhase === "growth" ? "成长" :
                   currentPhase === "deepening" ? "深化" : "成熟"}
                </div>
                <div className="text-xs text-white/40">关系阶段</div>
              </div>
            </div>
          </div>
        </section>

        {/* Emotion & Mood */}
        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
            <span>💭</span> 情绪状态
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center text-3xl">
              {MOOD_EMOJIS[currentMood] || "😊"}
            </div>
            <div className="flex-1">
              <div className="text-lg font-medium text-white">
                {currentMood === "neutral" ? "平静" :
                 currentMood === "happy" ? "开心" :
                 currentMood === "excited" ? "兴奋" :
                 currentMood === "shy" ? "害羞" :
                 currentMood === "love" ? "爱意" :
                 currentMood === "sad" ? "难过" :
                 currentMood === "angry" ? "生气" :
                 currentMood === "jealous" ? "吃醋" :
                 currentMood === "sleepy" ? "困倦" : currentMood}
              </div>
              <div className="text-sm text-white/50">
                情绪强度: {Math.round(emotion.intensity * 100)}%
              </div>
              <div className="text-sm text-white/50">
                效价: {emotion.valence > 0 ? "+" : ""}{Math.round(emotion.valence * 100)}%
              </div>
            </div>
          </div>

          {/* User Mood Guess */}
          {perception.userMoodGuess && (
            <div className="text-sm text-white/60 flex items-center gap-2">
              <span>👀</span>
              <span>我猜你现在的心情是：</span>
              <span className="text-white/80">{MOOD_EMOJIS[perception.userMoodGuess]} {perception.userMoodGuess}</span>
            </div>
          )}
        </section>

        {/* Body State */}
        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
            <span>💪</span> 身体状态
          </h3>
          <div className="space-y-2">
            <StateBar label="能量" value={body.energy} color="from-yellow-400 to-orange-400" />
            <StateBar label="饱腹" value={100 - body.hunger} color="from-green-400 to-emerald-400" />
            <StateBar label="困意" value={body.sleepiness} color="from-purple-400 to-indigo-400" />
            <StateBar label="健康" value={body.health} color="from-red-400 to-pink-400" />
          </div>
        </section>

        {/* Instincts */}
        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
            <span>🔥</span> 本能需求
          </h3>
          <div className="space-y-2">
            <StateBar label="陪伴" value={instinct.companionshipNeed} color="from-pink-400 to-rose-400" />
            <StateBar label="关注" value={instinct.attentionNeed} color="from-blue-400 to-cyan-400" />
            <StateBar label="安全" value={instinct.securityNeed} color="from-green-400 to-teal-400" />
            <StateBar label="亲密" value={instinct.intimacyNeed} color="from-red-400 to-orange-400" />
          </div>
        </section>

        {/* Relationship */}
        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
            <span>💕</span> 关系状态
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/70">亲密度</span>
                <span className="text-white/90">{Math.round(relationship.intimacy)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all"
                  style={{ width: `${relationship.intimacy}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/70">信任度</span>
                <span className="text-white/90">{Math.round(relationship.trust)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                  style={{ width: `${relationship.trust}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-lg">📅</div>
                <div className="text-sm text-white/80">{totalDays}</div>
                <div className="text-xs text-white/40">认识天数</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-lg">🔥</div>
                <div className="text-sm text-white/80">{relationship.streakDays || 1}</div>
                <div className="text-xs text-white/40">连续天数</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-lg">💬</div>
                <div className="text-sm text-white/80">{relationship.dailyInteractionCount || 0}</div>
                <div className="text-xs text-white/40">总消息</div>
              </div>
            </div>
          </div>
        </section>

        {/* Growth */}
        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
            <span>📈</span> 成长状态
          </h3>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xl font-bold text-white">
              {growth.level}
            </div>
            <div className="flex-1">
              <div className="text-sm text-white/70">等级 {growth.level}</div>
              <div className="text-xs text-white/40">
                {levelProgress}/100 经验
              </div>
              <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Economy */}
        {economy && (
          <section className="bg-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
              <span>💰</span> 经济状态
            </h3>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-2xl font-bold text-yellow-400">
                {economy.balance}
              </div>
              <div className="text-sm text-white/50">金币余额</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-white/60">
                收入: <span className="text-green-400">+{economy.totalEarned}</span>
              </div>
              <div className="text-white/60">
                支出: <span className="text-red-400">-{economy.totalSpent}</span>
              </div>
            </div>
          </section>
        )}

        {/* Inventory */}
        {inventory && inventory.length > 0 && (
          <section className="bg-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
              <span>🎁</span> 收藏品
            </h3>
            <div className="flex flex-wrap gap-2">
              {inventory.slice(0, 8).map((item, index) => (
                <div
                  key={item.id || index}
                  className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg"
                  title={item.name}
                >
                  {item.icon || "🎁"}
                </div>
              ))}
              {inventory.length > 8 && (
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-sm text-white/60">
                  +{inventory.length - 8}
                </div>
              )}
            </div>
          </section>
        )}

        {/* World View */}
        {worldView && (
          <section className="bg-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
              <span>🌟</span> 信念系统
            </h3>
            <div className="space-y-2">
              {Object.entries(worldView.beliefSystem || {}).slice(0, 4).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-16 text-xs text-white/60 capitalize">{key}</div>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full"
                      style={{ width: `${(value as number) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StateBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/60">{label}</span>
        <span className="text-white/80">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
