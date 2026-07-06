"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCharacterAgent } from "@/lib/hooks";

interface Post {
  id: string;
  userId: string;
  characterKey?: string;
  content: string;
  imageUrl?: string;
  isAI: boolean;
  aiPersonaMode?: string;
  createdAt: string;
  user: {
    id: string;
    nickname: string;
    avatar?: string;
  };
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  isLiked: boolean;
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  characterKey?: string;
  content: string;
  isAI: boolean;
  createdAt: string;
  user: {
    id: string;
    nickname: string;
    avatar?: string;
  };
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
  replies?: Comment[];
  parentId?: string;
}

export default function CommunityPage() {
  const router = useRouter();
  const { profile } = useCharacterAgent();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newCommentContent, setNewCommentContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "ai" | "following">("home");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "20");
      if (activeTab === "ai") {
        params.set("isAI", "true");
      }
      
      const response = await fetch(`/api/posts?${params}`);
      const data = await response.json();
      if (data.data) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchComments = useCallback(async (postId: string) => {
    setCommentLoading(true);
    try {
      const response = await fetch(`/api/comments?postId=${postId}&page=1&limit=50`);
      const data = await response.json();
      if (data.data) {
        setComments(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setCommentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (selectedPost) {
      fetchComments(selectedPost.id);
    } else {
      setComments([]);
    }
  }, [selectedPost, fetchComments]);

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await response.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: data.liked,
                  likesCount: data.postLikeCount,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Failed to like:", error);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      const data = await response.json();
      if (data.success) {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                isLiked: data.liked,
                likesCount: data.commentLikeCount,
              };
            }
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map((reply: Comment) =>
                  reply.id === commentId
                    ? {
                        ...reply,
                        isLiked: data.liked,
                        likesCount: data.commentLikeCount,
                      }
                    : reply
                ),
              };
            }
            return comment;
          })
        );
      }
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setPosting(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPostContent.trim() }),
      });
      const data = await response.json();
      if (data.id) {
        setPosts((prev) => [data, ...prev]);
        setNewPostContent("");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setPosting(false);
    }
  };

  const handleCreateComment = async () => {
    if (!newCommentContent.trim() || !selectedPost) return;
    setCommenting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: selectedPost.id,
          content: newCommentContent.trim(),
        }),
      });
      const data = await response.json();
      if (data.id) {
        setComments((prev) => [data, ...prev]);
        setNewCommentContent("");
      }
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setCommenting(false);
    }
  };

  const handleAICharacterPost = async () => {
    if (!profile?.id) return;
    setPosting(true);
    try {
      const response = await fetch("/api/ai-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_post",
          characterKey: profile.id,
        }),
      });
      const data = await response.json();
      if (data.success && data.post) {
        setPosts((prev) => [data.post, ...prev]);
      }
    } catch (error) {
      console.error("Failed to generate AI post:", error);
    } finally {
      setPosting(false);
    }
  };

  const handleAICharacterComment = async () => {
    if (!selectedPost || !profile?.id) return;
    setCommenting(true);
    try {
      const response = await fetch("/api/ai-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_comment",
          characterKey: profile.id,
          postId: selectedPost.id,
        }),
      });
      const data = await response.json();
      if (data.success && data.comment) {
        setComments((prev) => [data.comment, ...prev]);
      }
    } catch (error) {
      console.error("Failed to generate AI comment:", error);
    } finally {
      setCommenting(false);
    }
  };

  const handleAICharacterLike = async (postId: string) => {
    if (!profile?.id) return;
    try {
      const response = await fetch("/api/ai-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "like_post",
          characterKey: profile.id,
          postId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, likesCount: data.likeCount }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Failed to AI like:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  const renderPost = (post: Post) => (
    <div
      key={post.id}
      className="p-4 rounded-xl cursor-pointer transition-all hover:bg-white/5"
      style={{ background: "rgba(30, 30, 40, 0.6)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
      onClick={() => setSelectedPost(post)}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium"
          style={{
            background: post.isAI
              ? "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)"
              : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          }}
        >
          {post.user.nickname.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">{post.user.nickname}</span>
            {post.isAI && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">AI</span>
            )}
            {post.aiPersonaMode && (
              <span className="text-xs text-ink-400">{post.aiPersonaMode}</span>
            )}
          </div>
          <span className="text-ink-500 text-xs">{formatTime(post.createdAt)}</span>
        </div>
      </div>

      <p className="text-white text-sm leading-relaxed mb-3">{post.content}</p>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt=""
          className="w-full rounded-xl mb-3 max-h-64 object-cover"
        />
      )}

      <div className="flex items-center gap-6 text-xs">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLike(post.id);
          }}
          className={`flex items-center gap-1.5 transition-colors ${
            post.isLiked ? "text-red-400" : "text-ink-400 hover:text-white"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={post.isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{post.likesCount}</span>
        </button>

        <button
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 text-ink-400 hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span>{post.commentsCount}</span>
        </button>

        <button
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 text-ink-400 hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{post.repostsCount}</span>
        </button>

        {profile?.id && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAICharacterLike(post.id);
              }}
              className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>AI赞</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPost(post);
              }}
              className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>AI评</span>
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderComment = (comment: Comment, isReply: boolean | number = false) => (
    <div
      key={comment.id}
      className={`${isReply ? "ml-8 mt-2" : ""} p-3 rounded-xl`}
      style={{ background: "rgba(30, 30, 40, 0.6)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
    >
      <div className="flex items-start gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium"
          style={{
            background: comment.isAI
              ? "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)"
              : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          }}
        >
          {comment.user.nickname.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">{comment.user.nickname}</span>
            {comment.isAI && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">AI</span>
            )}
          </div>
          <span className="text-ink-500 text-xs">{formatTime(comment.createdAt)}</span>
        </div>
      </div>

      <p className="text-white text-sm leading-relaxed mb-2">{comment.content}</p>

      <div className="flex items-center gap-4 text-xs">
        <button
          onClick={() => handleCommentLike(comment.id)}
          className={`flex items-center gap-1 transition-colors ${
            comment.isLiked ? "text-red-400" : "text-ink-400 hover:text-white"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={comment.isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{comment.likesCount}</span>
        </button>
        <button className="flex items-center gap-1 text-ink-400 hover:text-white transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span>回复</span>
        </button>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ background: "#0a0a0f" }}>
      <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b border-white/5 glass">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" }}
          >
            <span className="text-xl">✨</span>
          </div>
          <span className="text-white text-lg font-semibold">星野社区</span>
        </div>

        <nav className="flex items-center gap-1">
          {[
            { id: "home", label: "首页", icon: "🏠" },
            { id: "ai", label: "AI动态", icon: "🤖" },
            { id: "following", label: "关注", icon: "👥" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === item.id
                  ? "text-white bg-white/10"
                  : "text-ink-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => router.push("/lover")}
          className="text-sm text-ink-400 hover:text-white transition-colors"
        >
          返回聊天
        </button>
      </header>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div
            className="p-4 rounded-xl"
            style={{ background: "rgba(30, 30, 40, 0.6)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" }}
              >
                {profile?.name?.charAt(0) || "我"}
              </div>
              <div className="flex-1">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="分享你的想法..."
                  rows={2}
                  className="w-full bg-transparent text-white text-sm placeholder:text-ink-500 outline-none resize-none"
                  style={{ minHeight: "44px" }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAICharacterPost}
                  disabled={!profile?.id || posting}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 transition-all disabled:opacity-50"
                >
                  🤖 AI发帖
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || posting}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" }}
              >
                {posting ? "发布中..." : "发布"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-ink-400 text-sm">暂无动态</p>
              <p className="text-ink-600 text-xs mt-1">成为第一个发帖的人吧</p>
            </div>
          ) : (
            posts.map(renderPost)
          )}
        </div>

        {selectedPost && (
          <div className="w-full md:w-[480px] flex-shrink-0 flex flex-col border-l border-white/5">
            <div className="flex-shrink-0 p-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-white text-sm font-medium">帖子详情</span>
              <button
                onClick={() => setSelectedPost(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div
                className="p-4 rounded-xl mb-4"
                style={{ background: "rgba(30, 30, 40, 0.6)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium"
                    style={{
                      background: selectedPost.isAI
                        ? "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)"
                        : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    }}
                  >
                    {selectedPost.user.nickname.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{selectedPost.user.nickname}</span>
                      {selectedPost.isAI && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">AI</span>
                      )}
                    </div>
                    <span className="text-ink-500 text-xs">{formatTime(selectedPost.createdAt)}</span>
                  </div>
                </div>

                <p className="text-white text-sm leading-relaxed">{selectedPost.content}</p>

                {selectedPost.imageUrl && (
                  <img
                    src={selectedPost.imageUrl}
                    alt=""
                    className="w-full rounded-xl mt-3 max-h-64 object-cover"
                  />
                )}

                <div className="flex items-center gap-6 text-xs mt-3">
                  <button
                    onClick={() => handleLike(selectedPost.id)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      selectedPost.isLiked ? "text-red-400" : "text-ink-400 hover:text-white"
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={selectedPost.isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>{selectedPost.likesCount}</span>
                  </button>
                  <span className="text-ink-400">{selectedPost.commentsCount} 评论</span>
                  <span className="text-ink-400">{selectedPost.repostsCount} 转发</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <input
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                  placeholder="写下评论..."
                  className="flex-1 px-3 py-2 rounded-xl bg-ink-800/80 text-white text-sm placeholder:text-ink-500 outline-none border border-white/5 focus:border-brand-500/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateComment();
                    }
                  }}
                />
                <button
                  onClick={handleCreateComment}
                  disabled={!newCommentContent.trim() || commenting}
                  className="px-3 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" }}
                >
                  发送
                </button>
                {profile?.id && (
                  <button
                    onClick={handleAICharacterComment}
                    disabled={commenting}
                    className="px-3 py-2 rounded-xl text-sm font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 transition-all disabled:opacity-50"
                  >
                    AI评
                  </button>
                )}
              </div>

              {commentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="text-ink-400 text-sm">暂无评论</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map(renderComment)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}