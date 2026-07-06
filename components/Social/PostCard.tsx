"use client";

import { useState } from "react";
import { Post, Comment } from "@/lib/core/social/types";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onUserClick?: (userId: string) => void;
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString();
}

function formatCount(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + "w";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

export function PostCard({ post, onLike, onComment, onUserClick }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
    onLike(post.id);
  };

  const handleSubmitComment = () => {
    if (!commentInput.trim()) return;
    onComment(post.id, commentInput);
    setCommentInput("");
  };

  return (
    <article
      className="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
    >
      <div className="flex gap-3">
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            background: `linear-gradient(135deg, ${post.author.accentColor} 0%, ${post.author.accentColor}99 100%)`,
          }}
          onClick={() => onUserClick?.(post.authorId)}
        >
          {post.author.name.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-white text-sm font-semibold hover:underline cursor-pointer"
              onClick={() => onUserClick?.(post.authorId)}
            >
              {post.author.name}
            </span>
            {post.author.verified && (
              <span className="text-brand-400 text-xs">✓</span>
            )}
            {post.author.isAI && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  background: `${post.author.accentColor}20`,
                  color: post.author.accentColor,
                }}
              >
                AI
              </span>
            )}
            <span className="text-ink-500 text-xs">
              {formatTime(post.createdAt)}
            </span>
          </div>

          <div className="text-white text-sm leading-relaxed mb-3 whitespace-pre-wrap">
            {post.content}
          </div>

          {post.images && post.images.length > 0 && (
            <div className="mb-3 rounded-xl overflow-hidden">
              <img
                src={post.images[0]}
                alt=""
                className="w-full object-cover"
              />
            </div>
          )}

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-brand-400 hover:text-brand-300 cursor-pointer transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 text-ink-400">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowComments(!showComments);
              }}
              className="flex items-center gap-1.5 hover:text-brand-400 transition-colors group"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:scale-110 transition-transform"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-xs">{formatCount(post.comments)}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              className={`flex items-center gap-1.5 transition-all group ${
                isLiked ? "text-pink-500" : "hover:text-pink-500"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:scale-110 transition-transform"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span className="text-xs">{formatCount(likes)}</span>
            </button>

            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 hover:text-brand-400 transition-colors group"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:scale-110 transition-transform"
              >
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              <span className="text-xs">{formatCount(post.reposts)}</span>
            </button>

            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 hover:text-brand-400 transition-colors group ml-auto"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:scale-110 transition-transform"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          </div>

          {showComments && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  }}
                >
                  我
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="说点什么..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] text-white text-sm placeholder:text-ink-500 outline-none border border-white/5 focus:border-brand-500/30 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmitComment();
                    }}
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentInput.trim()}
                    className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    }}
                  >
                    发送
                  </button>
                </div>
              </div>

              {comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                        style={{
                          background: `linear-gradient(135deg, ${comment.author.accentColor} 0%, ${comment.author.accentColor}99 100%)`,
                        }}
                      >
                        {comment.author.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-white text-xs font-medium">
                            {comment.author.name}
                          </span>
                          <span className="text-ink-500 text-xs">
                            {formatTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-white/80 text-xs">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-ink-500 text-xs py-4">
                  暂无评论，来说点什么吧～
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
