'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { mockPosts } from '@/data/community';
import { formatTimeAgo } from '@/utils/helpers';

export function CommunityPreview() {
  const [posts, setPosts] = useState(mockPosts.slice(0, 3));

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const typeLabels: Record<string, { label: string; color: string }> = {
    'check-in': { label: '学习打卡', color: 'bg-emerald-100 text-emerald-700' },
    achievement: { label: '成就分享', color: 'bg-amber-100 text-amber-700' },
    discussion: { label: '话题讨论', color: 'bg-blue-100 text-blue-700' },
    recommendation: { label: '课程推荐', color: 'bg-purple-100 text-purple-700' },
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
              学习社区
            </span>
            <h2 className="font-display text-4xl font-bold text-slate-900 mt-2">
              来自学习者的声音
            </h2>
            <p className="text-slate-500 mt-3 max-w-lg">
              加入活跃的学习社区，和志同道合的小伙伴一起进步
            </p>
          </div>
          <Link
            href="/community"
            className="hidden md:flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            进入社区
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={post.avatar}
                    alt={post.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">
                      {post.username}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatTimeAgo(post.createdAt)}
                    </div>
                  </div>
                </div>
                <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${
                    typeLabels[post.type]?.color ||
                    'bg-slate-100 text-slate-600'
                  }`}
                >
                  {typeLabels[post.type]?.label || post.type}
                </span>
                <p className="text-slate-700 text-sm leading-relaxed line-clamp-4">
                  {post.content}
                </p>
              </div>

              <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    post.liked
                      ? 'text-rose-500'
                      : 'text-slate-400 hover:text-rose-500'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`}
                  />
                  <span>{post.likes}</span>
                </button>
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/community"
            className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold"
          >
            探索社区
          </Link>
        </div>
      </div>
    </section>
  );
}
