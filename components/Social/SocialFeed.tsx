"use client";

import { useState, useEffect, useCallback } from "react";
import { PostCard } from "./PostCard";
import { Sidebar } from "./Sidebar";
import { Post, SocialUser, SocialFeedFilter } from "@/lib/core/social/types";
import { aiSocialEngine } from "@/lib/core/social/ai-social-engine";
import { MOCK_AI_USERS, TRENDING_TAGS } from "@/lib/core/social/types";

const FEED_TABS = [
  { id: "foryou", label: "为你推荐" },
  { id: "following", label: "关注" },
  { id: "trending", label: "热门" },
];

export function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<SocialFeedFilter["type"]>("foryou");
  const [showCompose, setShowCompose] = useState(false);
  const [composeContent, setComposeContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const trendingTags = TRENDING_TAGS;
  const suggestedUsers = MOCK_AI_USERS.slice(0, 5);

  useEffect(() => {
    const loadPosts = () => {
      setIsLoading(true);
      setTimeout(() => {
        const allPosts = aiSocialEngine.getPosts();
        setPosts(allPosts);
        setIsLoading(false);
      }, 300);
    };

    loadPosts();
  }, [activeTab]);

  const handleLike = useCallback((postId: string) => {
    aiSocialEngine.likePost(postId, "user");
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: !p.isLiked,
            likes: p.isLiked ? p.likes - 1 : p.likes + 1,
          };
        }
        return p;
      })
    );
  }, []);

  const handleComment = useCallback((postId: string, content: string) => {
    aiSocialEngine.addComment(postId, "user", content);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, comments: p.comments + 1 };
        }
        return p;
      })
    );
  }, []);

  const handleSubmitPost = useCallback(() => {
    if (!composeContent.trim()) return;
    const tags = composeContent
      .match(/#(\S+)/g)
      ?.map((t) => t.slice(1)) || [];
    aiSocialEngine.createPost("user", composeContent, tags);
    setComposeContent("");
    setShowCompose(false);
    setPosts(aiSocialEngine.getPosts());
  }, [composeContent]);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f" }}>
      <header className="sticky top-0 z-30 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
              }}
            >
              社
            </div>
            <h1 className="text-white font-bold text-lg">LifeOS 社区</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/5">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-ink-400"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="搜索..."
                className="bg-transparent text-white text-sm placeholder:text-ink-500 outline-none w-40"
              />
            </div>

            <button
              onClick={() => setShowCompose(true)}
              className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
              }}
            >
              发动态
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 flex">
        <div className="flex-1 min-w-0 border-x border-white/5 min-h-screen">
          <div className="sticky top-14 z-20 glass border-b border-white/5">
            <div className="flex">
              {FEED_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SocialFeedFilter["type"])}
                  className={`flex-1 py-3.5 text-sm font-medium relative transition-colors ${
                    activeTab === tab.id
                      ? "text-white"
                      : "text-ink-400 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <div
                className="w-10 h-10 rounded-full animate-spin"
                style={{
                  border: "3px solid rgba(139, 92, 246, 0.2)",
                  borderTopColor: "#8b5cf6",
                }}
              />
              <p className="text-ink-500 text-sm">加载中...</p>
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                />
              ))}
            </div>
          )}

          {posts.length === 0 && !isLoading && (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-ink-400 text-sm">还没有动态</p>
              <p className="text-ink-600 text-xs mt-1">
                成为第一个发动态的人吧～
              </p>
            </div>
          )}
        </div>

        <Sidebar
          trendingTags={trendingTags}
          suggestedUsers={suggestedUsers}
        />
      </div>

      {showCompose && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20"
          onClick={() => setShowCompose(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg mx-4 glass-strong rounded-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-white font-semibold">发动态</h3>
              <button
                onClick={() => setShowCompose(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <div className="flex gap-3">
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  }}
                >
                  我
                </div>
                <div className="flex-1">
                  <textarea
                    value={composeContent}
                    onChange={(e) => setComposeContent(e.target.value)}
                    placeholder="分享你的想法..."
                    rows={6}
                    className="w-full bg-transparent text-white text-base placeholder:text-ink-500 outline-none resize-none"
                    maxLength={500}
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <div className="flex items-center gap-1">
                <button className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition-all">
                  🖼️
                </button>
                <button className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition-all">
                  😊
                </button>
                <button className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition-all">
                  📍
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-ink-500 text-xs">
                  {composeContent.length}/500
                </span>
                <button
                  onClick={handleSubmitPost}
                  disabled={!composeContent.trim()}
                  className="px-5 py-2 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  }}
                >
                  发布
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
