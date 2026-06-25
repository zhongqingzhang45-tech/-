"use client";

import { useState } from "react";
import { LoverProfile, MoodType, MOOD_CONFIG } from "@/data/lover";

interface SettingsPanelProps {
  profile: LoverProfile;
  onUpdateProfile: (profile: Partial<LoverProfile>) => void;
  onClose: () => void;
}

export function SettingsPanel({ profile, onUpdateProfile, onClose }: SettingsPanelProps) {
  const [localProfile, setLocalProfile] = useState(profile);
  const [activeTab, setActiveTab] = useState<"basic" | "personality" | "appearance">("basic");

  const handleSave = () => {
    onUpdateProfile(localProfile);
    onClose();
  };

  const presetColors = [
    { primary: "#f472b6", secondary: "#a78bfa", name: "粉紫梦境" },
    { primary: "#fb7185", secondary: "#f97316", name: "落日余晖" },
    { primary: "#34d399", secondary: "#06b6d4", name: "薄荷青空" },
    { primary: "#fbbf24", secondary: "#f472b6", name: "蜜糖甜心" },
    { primary: "#60a5fa", secondary: "#a78bfa", name: "星空遐想" },
    { primary: "#f87171", secondary: "#fbbf24", name: "玫瑰晚霞" },
  ];

  const personalityTraits = [
    "温柔体贴", "活泼开朗", "傲娇高冷", "撒娇卖萌",
    "成熟稳重", "调皮搞怪", "细腻敏感", "元气满满",
    "知性优雅", "古灵精怪", "慵懒随性", "认真执着",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg max-h-[85vh]
        bg-gradient-to-br from-white/[0.08] to-white/[0.02]
        backdrop-blur-2xl border border-white/10 rounded-2xl
        shadow-2xl shadow-pink-500/10
        flex flex-col overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-pink-300 to-violet-300 bg-clip-text text-transparent">
            角色设定
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10
              flex items-center justify-center transition-colors text-white/60"
          >
            ✕
          </button>
        </div>

        <div className="flex border-b border-white/5">
          {[
            { id: "basic", label: "基础信息", icon: "👤" },
            { id: "personality", label: "性格设定", icon: "💫" },
            { id: "appearance", label: "外观风格", icon: "🎨" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-3 text-xs font-medium transition-all
                ${activeTab === tab.id
                  ? "text-pink-300 border-b-2 border-pink-400/50 bg-pink-500/5"
                  : "text-white/50 hover:text-white/70"
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/60 mb-1.5 block">TA 的名字</label>
                <input
                  type="text"
                  value={localProfile.name}
                  onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                    text-white text-sm focus:outline-none focus:border-pink-400/40
                    transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 mb-1.5 block">昵称（你对 TA 的称呼）</label>
                <input
                  type="text"
                  value={localProfile.nickname}
                  onChange={(e) => setLocalProfile({ ...localProfile, nickname: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                    text-white text-sm focus:outline-none focus:border-pink-400/40
                    transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 mb-1.5 block">TA 对你的称呼</label>
                <input
                  type="text"
                  value={localProfile.userNickname}
                  onChange={(e) => setLocalProfile({ ...localProfile, userNickname: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                    text-white text-sm focus:outline-none focus:border-pink-400/40
                    transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/60 mb-1.5 block">生日</label>
                  <input
                    type="text"
                    value={localProfile.birthday}
                    onChange={(e) => setLocalProfile({ ...localProfile, birthday: e.target.value })}
                    placeholder="MM-DD"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                      text-white text-sm focus:outline-none focus:border-pink-400/40
                      transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1.5 block">纪念日</label>
                  <input
                    type="text"
                    value={localProfile.anniversary}
                    onChange={(e) => setLocalProfile({ ...localProfile, anniversary: e.target.value })}
                    placeholder="在一起的日子"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                      text-white text-sm focus:outline-none focus:border-pink-400/40
                      transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "personality" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/60 mb-3 block">性格标签（可多选）</label>
                <div className="flex flex-wrap gap-2">
                  {personalityTraits.map((trait) => (
                    <button
                      key={trait}
                      className="px-3 py-1.5 rounded-full text-xs
                        bg-white/5 border border-white/10 text-white/70
                        hover:bg-pink-500/10 hover:border-pink-400/30 hover:text-pink-200
                        transition-all duration-200"
                    >
                      {trait}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 mb-1.5 block">性格描述</label>
                <textarea
                  value={localProfile.personality}
                  onChange={(e) => setLocalProfile({ ...localProfile, personality: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                    text-white text-sm focus:outline-none focus:border-pink-400/40
                    transition-colors resize-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/10">
                <p className="text-xs text-pink-300/80 leading-relaxed">
                  💡 小贴士：性格越丰富，TA 的回应就越有个性哦～ 你可以混合多种性格标签，创造出独一无二的 TA。
                </p>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/60 mb-3 block">主题配色</label>
                <div className="grid grid-cols-3 gap-3">
                  {presetColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setLocalProfile({
                        ...localProfile,
                        accentColor: color.primary,
                        secondaryColor: color.secondary,
                      })}
                      className={`p-3 rounded-xl border transition-all duration-200
                        ${localProfile.accentColor === color.primary
                          ? "border-pink-400/50 bg-white/5"
                          : "border-white/10 hover:border-white/20"
                        }`}
                    >
                      <div
                        className="w-full h-10 rounded-lg mb-2"
                        style={{
                          background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`,
                        }}
                      />
                      <p className="text-[10px] text-white/60 text-center">{color.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/60 mb-1.5 block">主色调</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localProfile.accentColor}
                      onChange={(e) => setLocalProfile({ ...localProfile, accentColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs text-white/50 font-mono">
                      {localProfile.accentColor}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1.5 block">辅色调</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localProfile.secondaryColor}
                      onChange={(e) => setLocalProfile({ ...localProfile, secondaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs text-white/50 font-mono">
                      {localProfile.secondaryColor}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-white/5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium
              bg-white/5 border border-white/10 text-white/70
              hover:bg-white/10 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium
              bg-gradient-to-r from-pink-500 to-violet-500 text-white
              hover:from-pink-400 hover:to-violet-400
              shadow-lg shadow-pink-500/25 transition-all"
          >
            保存设定
          </button>
        </div>
      </div>
    </div>
  );
}
