'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Flame,
  Clock,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { useLearningStore } from '@/store/useLearningStore';
import { getStudyTypeName } from '@/utils/helpers';
import { skillData, weeklyProgressData, generateHeatmapData } from '@/data/progress';

export default function ProgressPage() {
  const { todayMinutes, dailyGoal, stats, studyRecords } = useLearningStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const heatmapData = useMemo(() => generateHeatmapData(), []);
  const progressPercent = Math.min((todayMinutes / dailyGoal) * 100, 100);

  const statCards = [
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
      subValue: '已掌握',
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Target,
      label: '今日完成率',
      value: `${Math.round(progressPercent)}%`,
      subValue: '目标完成度',
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-50',
    },
  ];

  const months = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const generateCalendarWeeks = () => {
    const weeks: string[][] = [];
    const today = new Date();
    for (let w = 0; w < 53; w++) {
      const week: string[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(
          date.getDate() - ((52 - w) * 7 + (6 - d) - (6 - today.getDay()))
        );
        week.push(date.toISOString().split('T')[0]);
      }
      weeks.push(week);
    }
    return weeks;
  };

  const weeks = generateCalendarWeeks();

  const getHeatColor = (minutes: number) => {
    if (minutes === 0) return 'bg-slate-100';
    if (minutes < 15) return 'bg-indigo-200';
    if (minutes < 30) return 'bg-indigo-300';
    if (minutes < 60) return 'bg-indigo-400';
    if (minutes < 90) return 'bg-indigo-500';
    return 'bg-indigo-600';
  };

  const studyTypeData = [
    { name: '单词', value: 35 },
    { name: '语法', value: 25 },
    { name: '听力', value: 22 },
    { name: '口语', value: 18 },
  ];

  return (
    <main className="min-h-screen bg-gradient-hero">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-slate-900 mb-2">
            学习进度
          </h1>
          <p className="text-slate-500">追踪你的学习足迹，见证每一步成长</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map((card, index) => (
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

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-800">学习趋势</h3>
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                {['week', 'month', 'year'].map((range) => (
                  <button
                    key={range}
                    onClick={() =>
                      setTimeRange(range as 'week' | 'month' | 'year')
                    }
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      timeRange === range
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {range === 'week'
                      ? '本周'
                      : range === 'month'
                      ? '本月'
                      : '本年'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyProgressData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar
                    dataKey="minutes"
                    name="学习时长(分钟)"
                    fill="url(#colorGradient)"
                    radius={[6, 6, 0, 0]}
                  />
                  <defs>
                    <linearGradient
                      id="colorGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-6">能力雷达</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="能力值"
                    dataKey="value"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-800">学习日历</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>少</span>
              <div className="w-3 h-3 rounded-sm bg-slate-100" />
              <div className="w-3 h-3 rounded-sm bg-indigo-200" />
              <div className="w-3 h-3 rounded-sm bg-indigo-300" />
              <div className="w-3 h-3 rounded-sm bg-indigo-400" />
              <div className="w-3 h-3 rounded-sm bg-indigo-500" />
              <div className="w-3 h-3 rounded-sm bg-indigo-600" />
              <span>多</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              <div className="flex flex-col gap-1 mr-2">
                {weekDays.map((day, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 text-xs text-slate-400 flex items-center justify-center"
                  >
                    {day}
                  </div>
                ))}
              </div>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((date, dayIndex) => {
                    const minutes = heatmapData[date] || 0;
                    return (
                      <div
                        key={date}
                        className={`w-3 h-3 rounded-sm ${getHeatColor(
                          minutes
                        )} transition-all hover:scale-125 cursor-pointer`}
                        title={`${date}: ${minutes} 分钟`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-4 text-xs text-slate-400">
            {months.map((month, i) => (
              <span key={i}>{month}</span>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-6">学习类型分布</h3>
            <div className="space-y-4">
              {studyTypeData.map((item, index) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">{item.name}</span>
                    <span className="text-sm font-medium text-slate-800">
                      {item.value}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${item.value * 2}%`,
                        background: `linear-gradient(90deg, ${
                          index === 0
                            ? '#6366f1'
                            : index === 1
                            ? '#10b981'
                            : index === 2
                            ? '#f97316'
                            : '#ec4899'
                        }, ${
                          index === 0
                            ? '#8b5cf6'
                            : index === 1
                            ? '#14b8a6'
                            : index === 2
                            ? '#ef4444'
                            : '#f43f5e'
                        })`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-6">最近学习记录</h3>
            <div className="space-y-3">
              {studyRecords.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-4 p-3 bg-white/50 rounded-xl"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-800">
                      {getStudyTypeName(record.studyType)}
                    </div>
                    <div className="text-xs text-slate-500">{record.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-indigo-600">
                      {record.minutes} 分钟
                    </div>
                    <div className="text-xs text-slate-400">
                      正确率 {record.accuracy}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
