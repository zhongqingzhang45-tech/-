import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StudyRecord, UserAchievement } from '@/types';
import { generateStudyRecords, generateLearningPath } from '@/data/progress';
import { getUserAchievements } from '@/data/achievements';

interface LearningState {
  currentLanguage: string;
  currentLevel: string;
  dailyGoal: number;
  todayMinutes: number;
  studyRecords: StudyRecord[];
  achievements: UserAchievement[];
  learningPath: ReturnType<typeof generateLearningPath>;
  stats: {
    totalMinutes: number;
    totalWords: number;
    streakDays: number;
    coursesCompleted: number;
    grammarQuizzes: number;
    speakingPractices: number;
    listeningPractices: number;
  };
  setLanguage: (lang: string) => void;
  setLevel: (level: string) => void;
  addStudyTime: (minutes: number, type: string) => void;
  addWords: (count: number) => void;
  incrementGrammarQuizzes: () => void;
  incrementSpeakingPractices: () => void;
  incrementListeningPractices: () => void;
  checkAchievements: () => void;
  completeTask: (taskId: string) => void;
  refreshLearningPath: () => void;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      currentLanguage: 'english',
      currentLevel: 'beginner',
      dailyGoal: 30,
      todayMinutes: 25,
      studyRecords: generateStudyRecords(),
      achievements: [],
      learningPath: generateLearningPath('beginner'),
      stats: {
        totalMinutes: 360,
        totalWords: 120,
        streakDays: 7,
        coursesCompleted: 1,
        grammarQuizzes: 35,
        speakingPractices: 8,
        listeningPractices: 12,
      },

      setLanguage: (lang) => set({ currentLanguage: lang }),

      setLevel: (level) => set({ currentLevel: level }),

      addStudyTime: (minutes, type) => {
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const existingRecord = state.studyRecords.find((r) => r.date === today);
          
          let newRecords = [...state.studyRecords];
          if (existingRecord) {
            newRecords = newRecords.map((r) =>
              r.date === today
                ? { ...r, minutes: r.minutes + minutes, studyType: type }
                : r
            );
          } else {
            newRecords.unshift({
              id: `record-${Date.now()}`,
              date: today,
              minutes,
              wordsLearned: 0,
              accuracy: 0,
              studyType: type,
            });
          }

          return {
            todayMinutes: state.todayMinutes + minutes,
            studyRecords: newRecords,
            stats: {
              ...state.stats,
              totalMinutes: state.stats.totalMinutes + minutes,
            },
          };
        });
        get().checkAchievements();
      },

      addWords: (count) => {
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const existingRecord = state.studyRecords.find((r) => r.date === today);
          
          let newRecords = [...state.studyRecords];
          if (existingRecord) {
            newRecords = newRecords.map((r) =>
              r.date === today ? { ...r, wordsLearned: r.wordsLearned + count } : r
            );
          }

          return {
            studyRecords: newRecords,
            stats: {
              ...state.stats,
              totalWords: state.stats.totalWords + count,
            },
          };
        });
        get().checkAchievements();
      },

      incrementGrammarQuizzes: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            grammarQuizzes: state.stats.grammarQuizzes + 1,
          },
        }));
        get().checkAchievements();
      },

      incrementSpeakingPractices: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            speakingPractices: state.stats.speakingPractices + 1,
          },
        }));
        get().checkAchievements();
      },

      incrementListeningPractices: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            listeningPractices: state.stats.listeningPractices + 1,
          },
        }));
        get().checkAchievements();
      },

      checkAchievements: () => {
        const { stats } = get();
        const achievements = getUserAchievements(stats);
        set({ achievements });
      },

      completeTask: (taskId) => {
        set((state) => ({
          learningPath: {
            ...state.learningPath,
            tasks: state.learningPath.tasks.map((t) =>
              t.id === taskId ? { ...t, completed: true } : t
            ),
          },
        }));
      },

      refreshLearningPath: () => {
        const { currentLevel } = get();
        set({ learningPath: generateLearningPath(currentLevel) });
      },
    }),
    {
      name: 'linguaverse-learning',
    }
  )
);
