"use client";

import { useState } from "react";
import { DiaryEntry, ScheduleItem, GameOption, MOOD_CONFIG } from "@/data/lover";

type TabType = "diary" | "schedule" | "games";

interface SidebarProps {
  diary: DiaryEntry[];
  schedule: ScheduleItem[];
  games: GameOption[];
  onGameSelect: (gameId: string) => void;
  initialTab?: TabType;
}

export function Sidebar({ diary, schedule, games, onGameSelect, initialTab = "diary" }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "diary", label: "心情日记", icon: "📔" },
    { id: "schedule", label: "日程提醒", icon: "⏰" },
    { id: "games", label: "小游戏", icon: "🎮" },
  ];

  return (
    <div className="h-full flex flex-col bg-white/[0.03] backdrop-blur-xl border-l border-white/5">
      <div className="flex border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-xs font-medium transition-all duration-200
              ${activeTab === tab.id
                ? "text-pink-300 border-b-2 border-pink-400/50 bg-pink-500/5"
                : "text-white/50 hover:text-white/70"
              }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "diary" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/80">心情日记</h3>
              <button className="text-xs text-pink-400 hover:text-pink-300 transition-colors">
                + 写日记
              </button>
            </div>

            {diary.map((entry) => {
              const moodConfig = MOOD_CONFIG[entry.mood];
              return (
                <div
                  key={entry.id}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5
                    hover:border-pink-400/20 transition-all duration-200
                    hover:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{moodConfig.emoji}</span>
                    <span className="text-xs text-white/50">{entry.date}</span>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed mb-2">
                    {entry.content}
                  </p>
                  <div className="flex gap-1.5">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full
                          bg-pink-500/10 text-pink-300/80"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/80">日程提醒</h3>
              <button className="text-xs text-pink-400 hover:text-pink-300 transition-colors">
                + 添加
              </button>
            </div>

            {schedule.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl
                  bg-white/[0.03] border border-white/5
                  hover:border-violet-400/20 transition-all duration-200
                  hover:bg-white/[0.05]"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg
                    ${item.type === "reminder"
                      ? "bg-violet-500/15 text-violet-300"
                      : item.type === "date"
                      ? "bg-pink-500/15 text-pink-300"
                      : "bg-amber-500/15 text-amber-300"
                    }`}
                >
                  {item.type === "reminder" ? "⏰" : item.type === "date" ? "💝" : "🎉"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{item.title}</p>
                  <p className="text-xs text-white/40">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "games" && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 mb-4">互动小游戏</h3>

            <div className="grid grid-cols-2 gap-3">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => onGameSelect(game.id)}
                  className="group relative p-4 rounded-xl text-left
                    bg-white/[0.03] border border-white/5
                    hover:border-pink-400/30 hover:bg-white/[0.06]
                    transition-all duration-300 overflow-hidden"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0
                      group-hover:opacity-10 transition-opacity duration-300`}
                  />
                  <span className="text-2xl block mb-2">{game.icon}</span>
                  <p className="text-sm font-medium text-white/80 group-hover:text-white
                    transition-colors duration-200">
                    {game.name}
                  </p>
                  <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                    {game.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
