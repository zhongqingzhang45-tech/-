export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return formatDate(dateString);
};

export const formatMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}小时`;
  return `${hours}小时${mins}分钟`;
};

export const getLevelName = (level: string): string => {
  const levelMap: Record<string, string> = {
    beginner: '入门',
    elementary: '初级',
    intermediate: '中级',
    advanced: '高级',
    proficient: '精通',
  };
  return levelMap[level] || level;
};

export const getLanguageName = (lang: string): string => {
  const langMap: Record<string, string> = {
    english: '英语',
    japanese: '日语',
    korean: '韩语',
  };
  return langMap[lang] || lang;
};

export const getLanguageFlag = (lang: string): string => {
  const flagMap: Record<string, string> = {
    english: '🇬🇧',
    japanese: '🇯🇵',
    korean: '🇰🇷',
  };
  return flagMap[lang] || '🌐';
};

export const getStudyTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    vocabulary: '单词记忆',
    grammar: '语法练习',
    speaking: '口语跟读',
    listening: '听力训练',
    reading: '阅读练习',
  };
  return typeMap[type] || type;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
