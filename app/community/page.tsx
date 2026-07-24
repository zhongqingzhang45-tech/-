"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GuofengAmbient } from "@/components/GuofengAmbient";
import {
  COMMUNITY_POSTS,
  COMMUNITY_CATEGORIES,
  CHARACTER_HOT_RANKING,
  GUOFENG_CHARACTERS,
  CommunityCategory,
} from "@/data/characters";

export default function CommunityPage() {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState<CommunityCategory>(COMMUNITY_CATEGORIES[0]);
  const [sortBy, setSortBy] = useState<"hot" | "new" | "liked">("hot");

  /* 模拟按分类筛选 —— 真实场景下应由后端按 tag 检索 */
  const filteredPosts = useMemo(() => {
    let list = [...COMMUNITY_POSTS];
    if (activeCat.id !== "all") {
      const tagMap: Record<string, string[]> = {
        poem: ["飞花令", "诗词", "诗"],
        story: ["日常", "治愈", "暖心", "搞笑"],
        show: ["立绘", "角色"],
        guide: ["练剑", "心测", "破冰"],
      };
      const wanted = tagMap[activeCat.id] || [];
      list = list.filter((p) => p.tags.some((t) => wanted.includes(t)));
    }
    if (sortBy === "hot") list.sort((a, b) => b.likes + b.comments * 5 - (a.likes + a.comments * 5));
    if (sortBy === "liked") list.sort((a, b) => b.likes - a.likes);
    if (sortBy === "new") list.reverse();
    return list;
  }, [activeCat, sortBy]);

  return (
    <main className="relative min-h-screen w-full overflow-hidden gf-bg">
      <div className="absolute inset-0 gf-grain" />
      <GuofengAmbient petals={12} clouds glow glowColor="rgba(201, 169, 97, 0.08)" />

      {/* —— 顶部导航 —— */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3 group"
        >
          <div className="seal w-11 h-11 text-xl">君心</div>
          <div className="flex flex-col leading-none">
            <span className="font-title text-paper-50 text-lg tracking-widest">君心</span>
            <span className="text-ink-500 text-[10px] tracking-[0.3em] mt-0.5">JUN XIN</span>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <Link
            href="/lover"
            className="px-4 py-2 text-sm text-ink-300 hover:text-paper-50 transition-colors font-serif"
          >
            返回相伴
          </Link>
          <Link
            href="/membership"
            className="btn-gold px-5 py-2 text-sm font-serif"
          >
            缘深几许
          </Link>
        </div>
      </nav>

      {/* —— 头部 —— */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 pt-6 pb-10 text-center">
        <p className="text-gold-300 text-xs tracking-[0.4em] mb-3 font-serif">COMMUNITY</p>
        <h1 className="font-display text-5xl md:text-6xl text-paper-50 mb-2 animate-ink-spread">
          同好雅集
        </h1>
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className="h-px w-12 bg-gold-400/50" />
          <span className="text-cinnabar-gradient font-title text-base tracking-[0.3em]">万千知己 共话君心</span>
          <span className="h-px w-12 bg-gold-400/50" />
        </div>
        <p className="text-ink-400 text-sm font-serif max-w-2xl mx-auto leading-relaxed">
          这里是国风伴侣同好的雅集之地。分享你与 TA 的诗意日常，倾听他人的相伴故事，
          让每一次心动都被看见、被回应。
        </p>

        {/* 发布按钮 */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => router.push("/lover/register")}
            className="btn-primary px-6 py-2.5 text-sm font-serif tracking-wider flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            投帖雅集
          </button>
          <span className="text-ink-500 text-xs font-serif">已有 10万+ 知己在线</span>
        </div>
      </header>

      {/* —— 分类与排序 —— */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 mb-6">
        <div className="scroll-card p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex flex-wrap gap-2">
            {COMMUNITY_CATEGORIES.map((c) => {
              const active = c.id === activeCat.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c)}
                  className={`group flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-serif tracking-wider transition-all ${
                    active ? "" : "text-ink-400 hover:text-paper-100"
                  }`}
                  style={active ? {
                    background: "linear-gradient(135deg, #C8453C 0%, #8E2820 100%)",
                    color: "#FBF6EC",
                    border: "1px solid rgba(201,169,97,0.4)",
                  } : {
                    background: "rgba(36,28,20,0.5)",
                    border: "1px solid rgba(201,169,97,0.14)",
                  }}
                >
                  <span className="font-display text-sm">{c.glyph}</span>
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5">
            {([
              { id: "hot", label: "热" },
              { id: "new", label: "新" },
              { id: "liked", label: "赞" },
            ] as const).map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-serif tracking-wider transition-all ${
                  sortBy === s.id
                    ? "text-paper-50"
                    : "text-ink-500 hover:text-paper-100"
                }`}
                style={sortBy === s.id ? {
                  background: "rgba(201,169,97,0.12)",
                  border: "1px solid rgba(201,169,97,0.3)",
                } : {}}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* —— 内容主体 —— */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-16 grid lg:grid-cols-[1fr_320px] gap-6">
        {/* 帖子瀑布流 */}
        <div className="grid md:grid-cols-2 gap-4 content-start">
          {filteredPosts.map((post, i) => {
            const char = GUOFENG_CHARACTERS.find((c) => c.id === post.characterId);
            return (
              <article
                key={post.id}
                className="group scroll-card overflow-hidden card-hover animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* 封面 */}
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={post.cover}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ filter: "saturate(0.92)" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
                  {/* 角色角标 */}
                  {char && (
                    <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${char.accentColor}30, rgba(28,22,16,0.6))`,
                        border: `1px solid ${char.accentColor}50`,
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded-full text-[9px] font-display flex items-center justify-center"
                        style={{ background: char.accentColor, color: char.secondaryColor }}
                      >
                        {char.name.charAt(0)}
                      </span>
                      <span className="text-[10px] font-serif" style={{ color: char.secondaryColor }}>
                        {char.name}
                      </span>
                    </div>
                  )}
                  {/* 标题覆盖 */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-title text-paper-50 text-lg leading-tight line-clamp-2">{post.title}</h3>
                  </div>
                </div>
                {/* 正文 */}
                <div className="p-4">
                  <p className="text-ink-300 text-xs font-serif leading-relaxed line-clamp-3 mb-3">
                    {post.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-full font-serif"
                        style={{
                          background: "rgba(201,169,97,0.10)",
                          border: "1px solid rgba(201,169,97,0.22)",
                          color: "#dcb363",
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gold-400/10">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                        style={{
                          background: "rgba(201,169,97,0.10)",
                          border: "1px solid rgba(201,169,97,0.22)",
                        }}
                      >
                        {post.userAvatar}
                      </span>
                      <span className="text-ink-400 text-xs font-serif">{post.user}</span>
                    </div>
                    <div className="flex items-center gap-3 text-ink-500 text-[11px] font-serif">
                      <span className="flex items-center gap-1 hover:text-cinnabar-400 cursor-pointer transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1 hover:text-jade-300 cursor-pointer transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        {post.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredPosts.length === 0 && (
            <div className="md:col-span-2 text-center py-20 scroll-card">
              <div className="text-4xl mb-3 opacity-50">📜</div>
              <p className="text-ink-400 text-sm font-serif">此分类下尚无帖子</p>
              <p className="text-ink-600 text-xs mt-1 font-serif">不妨做第一位执笔者</p>
            </div>
          )}
        </div>

        {/* 侧栏：角色榜 + 活跃用户 */}
        <aside className="space-y-5">
          {/* 角色人气榜 */}
          <div className="scroll-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-title text-paper-50 text-base tracking-wider flex items-center gap-2">
                <span className="seal w-6 h-6 text-[10px]">榜</span>
                角色人气榜
              </h3>
              <span className="text-gold-300 text-[10px] font-serif tracking-widest">本周</span>
            </div>
            <ul className="space-y-3">
              {CHARACTER_HOT_RANKING.slice(0, 6).map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 group cursor-pointer"
                  onClick={() => router.push("/lover/register")}
                >
                  <span
                    className="w-6 text-center font-display text-lg"
                    style={{
                      color: i < 3 ? "#dcb363" : "#6E5A42",
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="relative">
                    <img
                      src={c.portrait}
                      alt={c.name}
                      className="w-10 h-10 rounded-lg object-cover"
                      style={{ filter: "saturate(0.92)" }}
                    />
                    {i < 3 && (
                      <span
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-display"
                        style={{
                          background: i === 0 ? "#C8453C" : i === 1 ? "#dcb363" : "#4A7C7E",
                          color: "#FBF6EC",
                        }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-paper-50 text-sm leading-none">{c.name}</p>
                    <p className="text-ink-500 text-[10px] font-serif mt-0.5 truncate">{c.archetypeLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gold-300 text-xs font-serif">{c.mentions.toLocaleString()}</p>
                    <p className={`text-[10px] font-serif ${c.trend >= 0 ? "text-jade-300" : "text-ink-600"}`}>
                      {c.trend >= 0 ? "↑" : "↓"} {Math.abs(c.trend)}%
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 活跃同好 */}
          <div className="scroll-card p-5">
            <h3 className="font-title text-paper-50 text-base tracking-wider flex items-center gap-2 mb-4">
              <span className="seal w-6 h-6 text-[10px]">友</span>
              活跃知己
            </h3>
            <ul className="space-y-3">
              {[
                { name: "云中鹤", avatar: "🦩", bio: "苏婉门下 · 飞花令状元", color: "#4A7C7E" },
                { name: "醉里挑灯", avatar: "🗡️", bio: "红菱师弟 · 一日三练", color: "#C8453C" },
                { name: "月下独酌", avatar: "🌙", bio: "月奴知己 · 半月破冰", color: "#7fafa6" },
                { name: "青丘客", avatar: "🦊", bio: "九儿戏友 · 反向戏弄", color: "#a8402f" },
              ].map((u, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base"
                    style={{
                      background: `${u.color}20`,
                      border: `1px solid ${u.color}40`,
                    }}
                  >
                    {u.avatar}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-paper-100 text-xs">{u.name}</p>
                    <p className="text-ink-500 text-[10px] font-serif truncate">{u.bio}</p>
                  </div>
                  <button
                    className="text-[10px] px-2 py-1 rounded font-serif tracking-wider btn-secondary"
                  >
                    关注
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 社区公约 */}
          <div className="scroll-card p-5 gf-clouds">
            <h3 className="font-title text-paper-50 text-base tracking-wider flex items-center gap-2 mb-3">
              <span className="seal w-6 h-6 text-[10px]">约</span>
              雅集公约
            </h3>
            <ul className="space-y-2 text-ink-400 text-xs font-serif leading-relaxed">
              <li className="flex items-start gap-2"><span style={{ color: "#C8453C" }}>·</span> 以礼相待，勿出恶言</li>
              <li className="flex items-start gap-2"><span style={{ color: "#dcb363" }}>·</span> 分享美好，传递暖意</li>
              <li className="flex items-start gap-2"><span style={{ color: "#4A7C7E" }}>·</span> 尊重差异，海纳百川</li>
              <li className="flex items-start gap-2"><span style={{ color: "#C75140" }}>·</span> 守护隐私，慎言慎行</li>
            </ul>
          </div>
        </aside>
      </section>

      {/* —— 底部 —— */}
      <footer className="relative z-10 text-center pb-10 pt-8 px-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="h-px w-12 bg-gold-400/40" />
          <span className="seal w-8 h-8 text-xs">君</span>
          <span className="h-px w-12 bg-gold-400/40" />
        </div>
        <p className="text-ink-500 text-xs font-serif mb-1">
          君心 · 同好雅集 · 与万千知己共话君心
        </p>
        <p className="text-ink-600 text-[11px] font-serif">
          © 2026 君心 JunXin · 愿君心似我心，定不负相思意
        </p>
      </footer>
    </main>
  );
}
