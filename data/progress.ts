import { StudyRecord, SkillData, LearningPath, LearningTask } from '@/types';

export const generateStudyRecords = (): StudyRecord[] => {
  const records: StudyRecord[] = [];
  const today = new Date();
  const types = ['vocabulary', 'grammar', 'speaking', 'listening', 'reading'];

  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const hasStudy = Math.random() > 0.15;
    if (hasStudy) {
      const minutes = Math.floor(Math.random() * 60) + 10;
      const wordsLearned = Math.floor(Math.random() * 30) + 5;
      const accuracy = Math.floor(Math.random() * 30) + 65;
      const studyType = types[Math.floor(Math.random() * types.length)];

      records.push({
        id: `record-${i}`,
        date: dateStr,
        minutes,
        wordsLearned,
        accuracy,
        studyType,
      });
    }
  }

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const skillData: SkillData[] = [
  { skill: '词汇', value: 75, fullMark: 100 },
  { skill: '语法', value: 68, fullMark: 100 },
  { skill: '听力', value: 82, fullMark: 100 },
  { skill: '口语', value: 55, fullMark: 100 },
  { skill: '阅读', value: 70, fullMark: 100 },
];

export const weeklyProgressData = [
  { day: '周一', minutes: 45, words: 25 },
  { day: '周二', minutes: 30, words: 18 },
  { day: '周三', minutes: 60, words: 35 },
  { day: '周四', minutes: 25, words: 15 },
  { day: '周五', minutes: 50, words: 28 },
  { day: '周六', minutes: 80, words: 45 },
  { day: '周日', minutes: 55, words: 30 },
];

export const generateHeatmapData = (): Record<string, number> => {
  const data: Record<string, number> = {};
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const hasStudy = Math.random() > 0.2;
    if (hasStudy) {
      data[dateStr] = Math.floor(Math.random() * 120) + 5;
    } else {
      data[dateStr] = 0;
    }
  }

  return data;
};

export const generateLearningPath = (level: string): LearningPath => {
  const tasks: LearningTask[] = [
    { id: 'task-1', title: '单词闪卡：日常问候', type: 'vocabulary', duration: 10, completed: true },
    { id: 'task-2', title: '语法练习：基本句型', type: 'grammar', duration: 15, completed: true },
    { id: 'task-3', title: '听力训练：自我介绍', type: 'listening', duration: 12, completed: false },
    { id: 'task-4', title: '口语跟读：常用表达', type: 'speaking', duration: 10, completed: false },
    { id: 'task-5', title: '单词复习', type: 'vocabulary', duration: 8, completed: false },
  ];

  const levelTitle: Record<string, string> = {
    beginner: '入门学习计划',
    elementary: '初级提升计划',
    intermediate: '中级进阶计划',
    advanced: '高级精通计划',
    proficient: '精通深化计划',
  };

  return {
    id: 'daily-path',
    title: levelTitle[level] || '每日学习计划',
    description: '根据你的水平和学习目标，为你量身定制的今日学习任务',
    duration: tasks.reduce((sum, t) => sum + t.duration, 0),
    tasks,
  };
};
