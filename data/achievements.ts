import { Achievement, UserAchievement } from '@/types';

export const achievements: Achievement[] = [
  {
    id: 'first-steps',
    name: '第一步',
    description: '完成第一次学习',
    icon: '🎯',
    conditionType: 'totalMinutes',
    conditionValue: 1,
    color: 'from-green-400 to-emerald-500',
  },
  {
    id: 'week-warrior',
    name: '周末战士',
    description: '连续学习7天',
    icon: '🔥',
    conditionType: 'streakDays',
    conditionValue: 7,
    color: 'from-orange-400 to-red-500',
  },
  {
    id: 'monthly-master',
    name: '月度达人',
    description: '连续学习30天',
    icon: '🏆',
    conditionType: 'streakDays',
    conditionValue: 30,
    color: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'word-collector-50',
    name: '词汇新手',
    description: '学习50个单词',
    icon: '📚',
    conditionType: 'totalWords',
    conditionValue: 50,
    color: 'from-blue-400 to-cyan-500',
  },
  {
    id: 'word-collector-200',
    name: '词汇达人',
    description: '学习200个单词',
    icon: '📖',
    conditionType: 'totalWords',
    conditionValue: 200,
    color: 'from-indigo-400 to-purple-500',
  },
  {
    id: 'word-collector-500',
    name: '词汇大师',
    description: '学习500个单词',
    icon: '🏅',
    conditionType: 'totalWords',
    conditionValue: 500,
    color: 'from-pink-400 to-rose-500',
  },
  {
    id: 'study-hour',
    name: '勤奋学子',
    description: '累计学习1小时',
    icon: '⏰',
    conditionType: 'totalMinutes',
    conditionValue: 60,
    color: 'from-teal-400 to-emerald-500',
  },
  {
    id: 'study-10-hours',
    name: '学习达人',
    description: '累计学习10小时',
    icon: '⭐',
    conditionType: 'totalMinutes',
    conditionValue: 600,
    color: 'from-violet-400 to-purple-500',
  },
  {
    id: 'first-course',
    name: '课程初探',
    description: '完成第一门课程',
    icon: '🎓',
    conditionType: 'coursesCompleted',
    conditionValue: 1,
    color: 'from-sky-400 to-blue-500',
  },
  {
    id: 'grammar-master',
    name: '语法高手',
    description: '完成50道语法题',
    icon: '✏️',
    conditionType: 'grammarQuizzes',
    conditionValue: 50,
    color: 'from-fuchsia-400 to-pink-500',
  },
  {
    id: 'speaker',
    name: '开口达人',
    description: '完成10次口语练习',
    icon: '🎤',
    conditionType: 'speakingPractices',
    conditionValue: 10,
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: 'listener',
    name: '顺风耳',
    description: '完成20次听力练习',
    icon: '👂',
    conditionType: 'listeningPractices',
    conditionValue: 20,
    color: 'from-emerald-400 to-teal-500',
  },
];

export const getUserAchievements = (userStats: {
  totalMinutes: number;
  totalWords: number;
  streakDays: number;
  coursesCompleted: number;
  grammarQuizzes: number;
  speakingPractices: number;
  listeningPractices: number;
}): UserAchievement[] => {
  return achievements.map((achievement) => {
    const current = userStats[achievement.conditionType as keyof typeof userStats] || 0;
    const progress = Math.min((current / achievement.conditionValue) * 100, 100);
    return {
      ...achievement,
      unlocked: current >= achievement.conditionValue,
      progress: Math.round(progress),
    };
  });
};
