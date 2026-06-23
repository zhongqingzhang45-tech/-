import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Course, CourseProgress } from '@/types';
import { courses } from '@/data/courses';

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  courseProgress: CourseProgress[];
  filterLanguage: string;
  filterLevel: string;
  setFilterLanguage: (lang: string) => void;
  setFilterLevel: (level: string) => void;
  getFilteredCourses: () => Course[];
  enrollCourse: (courseId: string) => void;
  updateProgress: (courseId: string, completedLessons: number) => void;
  getProgress: (courseId: string) => CourseProgress | undefined;
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      courses,
      currentCourse: null,
      courseProgress: [],
      filterLanguage: 'all',
      filterLevel: 'all',

      setFilterLanguage: (lang) => set({ filterLanguage: lang }),

      setFilterLevel: (level) => set({ filterLevel: level }),

      getFilteredCourses: () => {
        const { courses, filterLanguage, filterLevel } = get();
        return courses.filter((course) => {
          const langMatch = filterLanguage === 'all' || course.language === filterLanguage;
          const levelMatch = filterLevel === 'all' || course.level === filterLevel;
          return langMatch && levelMatch;
        });
      },

      enrollCourse: (courseId) => {
        const course = get().courses.find((c) => c.id === courseId);
        if (!course) return;

        const existing = get().courseProgress.find((p) => p.courseId === courseId);
        if (existing) return;

        const newProgress: CourseProgress = {
          id: `progress-${courseId}`,
          userId: 'user-1',
          courseId,
          completedLessons: 0,
          progressPercent: 0,
          lastStudyDate: new Date().toISOString(),
        };

        set((state) => ({
          courseProgress: [...state.courseProgress, newProgress],
        }));
      },

      updateProgress: (courseId, completedLessons) => {
        const course = get().courses.find((c) => c.id === courseId);
        if (!course) return;

        const progressPercent = Math.round((completedLessons / course.lessonsCount) * 100);

        set((state) => ({
          courseProgress: state.courseProgress.map((p) =>
            p.courseId === courseId
              ? { ...p, completedLessons, progressPercent, lastStudyDate: new Date().toISOString() }
              : p
          ),
        }));
      },

      getProgress: (courseId) => {
        return get().courseProgress.find((p) => p.courseId === courseId);
      },
    }),
    {
      name: 'linguaverse-courses',
    }
  )
);
