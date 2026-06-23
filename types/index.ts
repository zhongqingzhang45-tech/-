export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  targetLanguage: string;
  level: string;
  streakDays: number;
  totalMinutes: number;
  totalWords: number;
  createdAt: string;
}

export interface Course {
  id: string;
  language: string;
  level: string;
  title: string;
  description: string;
  coverImage: string;
  duration: number;
  lessonsCount: number;
  rating: number;
  studentsCount: number;
  instructor: string;
  instructorAvatar: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
  duration: number;
  content: string;
  words: Word[];
  grammarQuizzes: GrammarQuiz[];
}

export interface Word {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
}

export interface GrammarQuiz {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface CourseProgress {
  id: string;
  userId: string;
  courseId: string;
  completedLessons: number;
  progressPercent: number;
  lastStudyDate: string;
}

export interface StudyRecord {
  id: string;
  date: string;
  minutes: number;
  wordsLearned: number;
  accuracy: number;
  studyType: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  conditionType: string;
  conditionValue: number;
  color: string;
}

export interface UserAchievement extends Achievement {
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  type: string;
  likes: number;
  comments: number;
  createdAt: string;
  liked?: boolean;
}

export interface LeaderboardUser {
  id: string;
  username: string;
  avatar: string;
  value: number;
  rank: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  duration: number;
  tasks: LearningTask[];
}

export interface LearningTask {
  id: string;
  title: string;
  type: string;
  duration: number;
  completed: boolean;
}

export interface SkillData {
  skill: string;
  value: number;
  fullMark: number;
}
