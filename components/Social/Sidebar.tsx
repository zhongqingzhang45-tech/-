"use client";

import { SocialUser } from "@/lib/core/social/types";

interface SidebarProps {
  trendingTags: { tag: string; count: number }[];
  suggestedUsers: SocialUser[];
  onTagClick?: (tag: string) => void;
  onUserClick?: (userId: string) => void;
}

function formatCount(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + "w";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

export function Sidebar({ trendingTags, suggestedUsers, onTagClick, onUserClick }: SidebarProps) {
  return (
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <div className="sticky top-16 space-y-4">
        <div className="card p-4">
          <h3 className="text-white font-semibold text-sm mb-3">🔥 热门话题</h3>
          <div className="space-y-2">
            {trendingTags.slice(0, 8).map((item, index) => (
              <button
                key={item.tag}
                onClick={() => onTagClick?.(item.tag)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
              >
                <span className="text-ink-500 text-xs font-bold w-4">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium group-hover:text-brand-400 transition-colors truncate">
                    #{item.tag}
                  </p>
                  <p className="text-ink-500 text-xs">
                    {formatCount(item.count)} 条动态
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-white font-semibold text-sm mb-3">✨ 推荐关注</h3>
          <div className="space-y-3">
            {suggestedUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${user.accentColor} 0%, ${user.accentColor}99 100%)`,
                  }}
                  onClick={() => onUserClick?.(user.id)}
                >
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className="text-white text-sm font-medium hover:underline cursor-pointer truncate"
                      onClick={() => onUserClick?.(user.id)}
                    >
                      {user.name}
                    </span>
                    {user.isAI && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{
                          background: `${user.accentColor}20`,
                          color: user.accentColor,
                        }}
                      >
                        AI
                      </span>
                    )}
                  </div>
                  <p className="text-ink-500 text-xs truncate">{user.bio}</p>
                </div>
                <button
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${user.accentColor} 0%, ${user.accentColor}cc 100%)`,
                  }}
                >
                  关注
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="text-ink-600 text-xs px-2">
          <p>关于 · 帮助 · 隐私 · 条款</p>
          <p className="mt-1">© 2024 LifeOS Social</p>
        </div>
      </div>
    </aside>
  );
}
