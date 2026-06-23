'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Settings,
  Trophy,
  BookOpen,
  Target,
  Flame,
  Clock,
  ChevronRight,
  Edit3,
  LogOut,
  Globe2,
  Sparkles,
  CheckCircle,
  Play,
} from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useLearningStore } from '@/store/useLearningStore';
import { achievements, getUserAchievements } from '@/data/achievements';
import { languages } from '@/data/courses';
import { formatMinutes, getLevelName } from '@/utils/helpers';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, logout, updateProfile } = useUserStore();
  const {
    stats,
    currentLanguage,
    currentLevel,
    learningPath,
    setLanguage,
    setLevel,
    completeTask,
    checkAchievements,
    refreshLearningPath,
  } = useLearningStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'path'>('overview');
  const [userAchievements, setUserAchievements] = useState<any[]>([]);

  useEffect(() => {
    checkAchievements();
    const result = getUserAchievements(stats as any);
    setUserAchievements(result);
  }, [stats]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router]);

  if (!user) return null;

  const unlockedCount = userAchievements.filter((a) => a.unlocked).length;
  const completedTasks = learningPath.tasks.filter((t) => t.completed).length;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const taskIcons: Record<string, string> = {
    vocabulary: '📚',
    grammar: '✏️',
    listening: '👂',
    speaking: '🎤',
    reading: '📖',
  };

  return (
    <main className="min-h-screen bg-gradient-hero">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="glass rounded-3xl p-8 shadow-xl mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg"
              />
              <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">
                {user.username}
              </h1>
              <p className="text-slate-500 mb-3">{user.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
                <span className="flex items-center gap-1 text-slate-600">
                  <Globe2 className="w-4 w-4" />
                  正在学习：
                  {languages.find((l) => l.id === user.targetLanguage)?.flag}{' '}
                  {languages.find((l) => l.id === user.targetLanguage)?.name}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">
                  {getLevelName(currentLevel)}水平
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="p-3 rounded-xl bg-white/50 text-slate-600 hover:bg-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-3 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-5 h-555" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { icon: Flame, label: '连续学习', value: `${stats.streakDays} 天`, color: 'from-orange-400 to-red-500' },
              { icon: Clock, label: '累计时长', value: formatMinutes(stats.totalMinutes), color: 'from-blue-400 to-indigo-500' },
              { icon: BookOpen, label: '已学单词', value: `${stats.totalWords} 个`, color: 'from-emerald-400 to-teal-500' },
              { icon: Trophy, label: '获得成就', value: `${unlockedCount} 个`, color: 'from-amber-400 to-orange-500' },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="bg-white/50 rounded-2xl p-4 text-center"
              >
                <div
                  className={`w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}
                >
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { id: 'overview', label: '学习概览', icon: User },
            { id: 'achievements', label: '成就徽章', icon: Trophy },
            { id: 'path', label: '学习路径', icon: Target },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-primary text-white shadow-lg'
                  : 'glass text-slate-600 hover:bg-white/80'
              }`}
            >
              <tab.icon className="w-55555" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">学习偏好设置</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-slate-600 mb-2">
                    目标语言
                  </label>
                  <div className="flex gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => {
                          setLanguage(lang.id);
                          updateProfile({ targetLanguage: lang.id });
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          currentLanguage === lang.id
                            ? `bg-gradient-to-r ${lang.color} text-white shadow-md`
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        {lang.flag} {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-2">
                    当前水平
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {['beginner', 'elementary', 'intermediate', 'advanced'].map(
                      (level) => (
                        <button
                          key={level}
                          onClick={() => setLevel(level)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            currentLevel === level
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                          }`}
                        >
                          {getLevelName(level)}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">账号信息</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">用户名</span>
                  <span className="text-sm font-medium text-slate-800">
                    {user.username}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">邮箱</span>
                  <span className="text-sm font-medium text-slate-800">
                    {user.email}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">注册时间</span>
                  <span className="text-sm font-medium text-slate-800">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-slate-500">学习天数</span>
                  <span className="text-sm font-medium text-indigo-600">
                    {Math.floor(stats.totalMinutes / 30)} 天
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="glass rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-slate-800">成就徽章</h3>
                <p className="text-sm text-slate-500 mt-1">
                  已获得 {unlockedCount} / {achievements.length} 个成就
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gradient">
                  {Math.round((unlockedCount / achievements.length) * 100)}%
                </div>
                <div className="text-xs text-slate-400">完成度</div>
              </div>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-gradient-primary rounded-full transition-all duration-1000"
                style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userAchievements.map((achievement, index) => (
                <div
                  key={achievement.id}
                  className={`relative rounded-2xl p-5 text-center transition-all ${
                    achievement.unlocked
                      ? 'bg-white shadow-md hover:shadow-lg hover:-translate-y-1'
                      : 'bg-slate-50 opacity-60'
                  }`}
                >
                  <div
                    className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-3xl ${
                      achievement.unlocked
                        ? `bg-gradient-to-br ${achievement.color} shadow-lg`
                        : 'bg-slate-200 grayscale'
                    }`}
                  >
                    {achievement.icon}
                  </div>
                  <div
                    className={`font-semibold text-sm ${
                      achievement.unlocked ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {achievement.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {achievement.description}
                  </div>
                  {!achievement.unlocked && (
                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-400 rounded-full"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {achievement.progress}%
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'path' && (
          <div className="glass rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-slate-800">
                    {learningPath.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-500">{learningPath.description}</p>
              </div>
              <button
                onClick={refreshLearningPath}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                刷新
              </button>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-4 mb-6 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600 mb-1">今日目标</div>
                <div className="text-lg font-bold text-indigo-600">
                  {completedTasks} / {learningPath.tasks.length} 个任务
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">预计时长</div>
                <div className="text-lg font-bold text-indigo-600">
                  {learningPath.duration} 分钟
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {learningPath.tasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    task.completed
                      ? 'bg-emerald-50 border border-emerald-100'
                      : 'bg-white/50 border border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        task.completed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-indigo-100'
                      }`}
                    >
                      {task.completed ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <span>{taskIcons[task.type] || '📝'}</span>
                      )}
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow text-xs font-bold text-slate-500 flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div
                      className={`font-medium ${
                        task.completed
                          ? 'text-emerald-700 line-through'
                          : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {task.duration} 分钟
                    </div>
                  </div>
                  {task.completed ? (
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      已完成
                    </span>
                  ) : (
                    <button
                      onClick={() => completeTask(task.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      开始
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white flex-shrink-0">
                  <Sparkles className="w-5 h-555" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-800 mb-1">AI 学习建议</h4>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    根据你的学习数据分析，建议今天重点练习听力和口语部分。
                    你的听力能力提升较快，继续保持！口语部分需要多加练习哦。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
