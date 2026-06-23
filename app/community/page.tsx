'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trophy,
  Flame,
  PenLine,
  ImagePlus,
  Hash,
} from 'lucide-react';
import { mockPosts, streakLeaderboard, minutesLeaderboard } from '@/data/community';
import { formatTimeAgo } from '@/utils/helpers';
import { Post } from '@/types';

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [activeTab, setActiveTab] = useState<'all' | 'check-in' | 'achievement' | 'discussion'>('all');
  const [leaderboardTab, setLeaderboardTab] = useState<'streak' | 'minutes'>('streak');
  const [newPost, setNewPost] = useState('');

  const typeLabels: Record<string, { label: string; color: string; icon: string }> = {
    'check-in': { label: '学习打卡', color: 'bg-emerald-100 text-emerald-700', icon: '✓' },
    achievement: { label: '成就分享', color: 'bg-amber-100 text-amber-700', icon: '🏆' },
    discussion: { label: '话题讨论', color: 'bg-blue-100 text-blue-700', icon: '💬' },
    recommendation: { label: '课程推荐', color: 'bg-purple-100 text-purple-700', icon: '📚' },
  };

  const filteredPosts = posts.filter((post) => {
    if (activeTab === 'all') return true;
    return post.type === activeTab;
  });

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

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post: Post = {
      id: `post-${Date.now()}`,
      userId: 'current-user',
      username: '我',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
      content: newPost,
      type: 'check-in',
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      liked: false,
    };
    setPosts([post, ...posts]);
    setNewPost('');
  };

  const leaderboard = leaderboardTab === 'streak' ? streakLeaderboard : minutesLeaderboard;
  const leaderboardUnit = leaderboardTab === 'streak' ? '天' : '分钟';

  return (
    <main className="min-h-screen bg-gradient-hero">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-slate-900 mb-2">
            社区广场
          </h1>
          <p className="text-slate-500">和志同道合的学习者一起，互相激励，共同进步</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-2xl p-6 shadow-sm">
              <div className="flex gap-4">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=me"
                  alt="avatar"
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="分享你的学习心得..."
                    className="w-full p-3 bg-white/50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-slate-400">
                      <button className="flex items-center gap-1 text-sm hover:text-indigo-600 transition-colors">
                        <ImagePlus className="w-4 h-4" />
                        图片
                      </button>
                      <button className="flex items-center gap-1 text-sm hover:text-indigo-600 transition-colors">
                        <Hash className="w-4 h-4" />
                        话题
                      </button>
                    </div>
                    <button
                      onClick={handlePost}
                      disabled={!newPost.trim()}
                      className="btn-primary px-5 py-2 rounded-full text-sm font-medium disabled:opacity-50"
                    >
                      发布
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'all', label: '全部' },
                { id: 'check-in', label: '学习打卡' },
                { id: 'achievement', label: '成就分享' },
                { id: 'discussion', label: '话题讨论' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-primary text-white shadow-md'
                      : 'glass text-slate-600 hover:bg-white/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="glass rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.avatar}
                        alt={post.username}
                        className="w-11 h-11 rounded-full"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">
                          {post.username}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          {formatTimeAgo(post.createdAt)}
                          <span>·</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              typeLabels[post.type]?.color
                            }`}
                          >
                            {typeLabels[post.type]?.icon}{' '}
                            {typeLabels[post.type]?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                      <MoreHorizontal className="w-55-5" />
                    </button>
                  </div>

                  <p className="text-slate-700 leading-relaxed mb-4 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        post.liked
                          ? 'text-rose-500'
                          : 'text-slate-400 hover:text-rose-500'
                      }`}
                    >
                      <Heart className={`w-55 ${post.liked ? 'fill-current' : ''}`} />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-500 transition-colors">
                      <MessageCircle className="w-555" />
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-500 transition-colors">
                      <Share2 className="w-555" />
                      <span>分享</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-55 text-amber-500" />
                <h3 className="font-semibold text-slate-800">学习排行榜</h3>
              </div>

              <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-5">
                <button
                  onClick={() => setLeaderboardTab('streak')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    leaderboardTab === 'streak'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  连续天数
                </button>
                <button
                  onClick={() => setLeaderboardTab('minutes')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    leaderboardTab === 'minutes'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  <PenLine className="w-3.5 h-3.5" />
                  学习时长
                </button>
              </div>

              <div className="space-y-3">
                {leaderboard.slice(0, 8).map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                      user.rank <= 3 ? 'bg-gradient-to-r from-amber-50 to-transparent' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        user.rank === 1
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white'
                          : user.rank === 2
                          ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                          : user.rank === 3
                          ? 'bg-gradient-to-br from-orange-300 to-amber-400 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {user.rank}
                    </div>
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {user.username}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-indigo-600">
                      {user.value.toLocaleString()}
                      <span className="text-xs text-slate-400 ml-0.5">
                        {leaderboardUnit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors font-medium">
                查看完整榜单
              </button>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="font-semibold text-lg mb-2">🔥 热门话题</h3>
              <div className="space-y-3">
                {[
                  { tag: '#英语学习打卡', count: '1.2万' },
                  { tag: '#日语零基础', count: '8563' },
                  { tag: '#韩语入门', count: '6234' },
                  { tag: '#每日背单词', count: '5421' },
                  { tag: '#学习方法分享', count: '3876' },
                ].map((topic, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-white/90 hover:text-white cursor-pointer transition-colors"
                  >
                    <span className="text-sm">{topic.tag}</span>
                    <span className="text-xs opacity-70">{topic.count} 讨论</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
