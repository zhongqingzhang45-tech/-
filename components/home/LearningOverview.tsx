'use client';

import Link from 'next/link';
import { Clock, Flame, BookOpen, Target, ChevronRight } from 'lucide-react';
import { useLearningStore } from '@/store/useLearningStore';
import { useUserStore } from '@/store/useUserStore';
import { formatMinutes } from '@/utils/helpers';

export function LearningOverview() {
  const { todayMinutes, dailyGoal, stats, learningPath } = useLearningStore();
  const { isLoggedIn } = useUserStore();

  const progressPercent = Math.min((todayMinutes / dailyGoal) * 100, 100);
  const completedTasks = learningPath.tasks.filter((t) => t.completed).length;

  const statsCards = [
    {
      icon: Clock,
      label: '今日学习',
      value: `${todayMinutes} 分钟`,
      subValue: `目标 ${dailyGoal} 分钟`,
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-50',
    },
    {
      icon: Flame,
      label: '连续学习',
      value: `${stats.streakDays} 天`,
      subValue: '继续保持！',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
    },
    {
      icon: BookOpen,
      label: '累计单词',
      value: `${stats.totalWords} 个`,
      subValue: '词汇量',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Target,
      label: '今日任务',
      value: `${completedTasks}/${learningPath.tasks.length}`,
      subValue: '已完成',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
    },
  ];

  if (!isLoggedIn) {
    return (
      <section className="py-20 -mt-12 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass rounded-3xl p-10 shadow-xl text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-primary flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h2 className="font-display text-3xl font-bold text-slate-900 mb-3">
              开始你的学习之旅
            </h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              登录后即可追踪学习进度、获得个性化推荐、解锁成就徽章
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/login"
                className="btn-primary px-8 py-3 rounded-full font-semibold"
              >
                立即登录
              </Link>
              <Link
                href="/register"
                className="btn-secondary px-8 py-3 rounded-full font-semibold"
              >
                免费注册
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 -mt-12 relative z-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="glass rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                学习概览
              </h2>
              <p className="text-slate-500 mt-1">今天也要加油哦！</p>
            </div>
            <Link
              href="/progress"
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              查看详情
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-600">
                今日目标进度
              </span>
              <span className="text-sm font-semibold text-indigo-600">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              已学习 {formatMinutes(todayMinutes)}，还需 {formatMinutes(Math.max(dailyGoal - todayMinutes, 0))} 完成今日目标
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((card, index) => (
              <div
                key={card.label}
                className={`${card.bgColor} rounded-2xl p-5 card-hover`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-lg`}
                >
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {card.value}
                </div>
                <div className="text-sm text-slate-500 mt-1">{card.label}</div>
                <div className="text-xs text-slate-400 mt-1">{card.subValue}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">今日学习任务</h3>
              <Link
                href="/learn/vocabulary"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                开始学习
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {learningPath.tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    task.completed
                      ? 'bg-emerald-50 border border-emerald-100'
                      : 'bg-white/50 border border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      task.completed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {task.completed ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">
                        {task.type === 'vocabulary'
                          ? '词'
                          : task.type === 'grammar'
                          ? '语'
                          : task.type === 'listening'
                          ? '听'
                          : '说'}
                      </span>
                    )}
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
                    <div className="text-xs text-slate-500">{task.duration} 分钟</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
