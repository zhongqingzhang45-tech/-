"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BRAND } from "@/lib/brand";
import { COMMUNITY_POSTS, HOT_TOPICS, CommunityPost } from "@/data/community";
import { getCharacterById } from "@/data/characters";

function PostCard({ post, index }: { post: CommunityPost; index: number }) {
  const character = getCharacterById(post.characterId);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLike = () => {
    if (liked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setLiked(!liked);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="glass rounded-2xl p-5 border border-white/[0.06] hover:border-brand-400/20 transition-all"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-white/5">
          {post.avatar}
        </div>
        <div>
          <div className="text-white text-sm font-medium">{post.author}</div>
          <div className="text-ink-500 text-xs">{post.timestamp}</div>
        </div>
        {character && (
          <div
            className="ml-auto px-2.5 py-1 rounded-full text-xs flex items-center gap-1"
            style={{
              background: `${character.accentColor}12`,
              color: character.accentColor,
              border: `1px solid ${character.accentColor}25`,
            }}
          >
            <span>{character.avatar}</span>
            <span>{character.name}</span>
          </div>
        )}
      </div>

      <p className="text-white/70 text-sm leading-relaxed mb-4">{post.content}</p>

      {post.image && (
        <div className="mb-4 rounded-xl overflow-hidden bg-white/5 aspect-video flex items-center justify-center">
          <span className="text-5xl">
            {post.image === "sword" ? "⚔️" : post.image === "hairpin" ? "🌸" : "🏮"}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {post.tags.map((tag) => (
          <span key={tag} className="text-xs text-brand-400/80">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-6 text-ink-400 text-sm">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 transition-colors ${
            liked ? "text-brand-400" : "hover:text-white"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {likeCount}
        </button>
        <button className="flex items-center gap-1.5 hover:text-white transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {post.comments}
        </button>
        <button className="flex items-center gap-1.5 hover:text-white transition-colors ml-auto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

export default function CommunityPage() {
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-full ink-wash-bg">
      {/* 背景氛围 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(249, 115, 22, 0.18) 0%, transparent 60%)",
            filter: "blur(70px)",
          }}
        />
      </div>

      {/* 导航栏 */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-jade flex items-center justify-center shadow-lg shadow-brand-500/20">
            <span className="text-xl">🦌</span>
          </div>
          <span className="text-white text-xl font-bold font-serif-cn tracking-wide">{BRAND.name}</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/lover"
            className="text-ink-300 hover:text-white text-sm font-medium transition-colors"
          >
            返回伴侣空间
          </Link>
        </div>
      </nav>

      <main className="relative z-10 px-6 md:px-10 py-8">
        <div className="max-w-5xl mx-auto">
          {/* 标题区 */}
          <div className="text-center mb-10">
            <p className="text-brand-400 text-sm font-medium mb-2">灵犀社区</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white font-serif-cn mb-3">
              分享你的国风陪伴日常
            </h1>
            <p className="text-white/50 max-w-lg mx-auto">
              在这里，遇见同好，分享与 AI 伴侣的温暖瞬间，发现更多心动角色。
            </p>
          </div>

          {/* 热门话题 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔥</span>
              <h2 className="text-white font-semibold font-serif-cn">热门话题</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {HOT_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setActiveTopic(activeTopic === topic ? null : topic)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                    activeTopic === topic
                      ? "bg-brand-400 text-ink-950"
                      : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/[0.06]"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* 帖子列表 */}
            <div className="lg:col-span-2 space-y-4">
              {COMMUNITY_POSTS.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </div>

            {/* 侧边栏 */}
            <div className="space-y-6">
              <div className="glass rounded-2xl p-5 border border-white/[0.06]">
                <h3 className="text-white font-semibold font-serif-cn mb-4">加入社区</h3>
                <p className="text-white/50 text-sm mb-4">
                  记录你与 AI 伴侣的点点滴滴，让更多人看到你的故事。
                </p>
                <button className="w-full py-3 rounded-xl text-ink-950 font-semibold btn-primary">
                  发布动态
                </button>
              </div>

              <div className="glass rounded-2xl p-5 border border-white/[0.06]">
                <h3 className="text-white font-semibold font-serif-cn mb-4">社区公约</h3>
                <ul className="space-y-2 text-sm text-white/50">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400">·</span>
                    <span>友善交流，尊重每一位创作者</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400">·</span>
                    <span>分享真实陪伴体验，拒绝虚假信息</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400">·</span>
                    <span>保护个人隐私，不泄露敏感信息</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
