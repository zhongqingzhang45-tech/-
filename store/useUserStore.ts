import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { username: string; email: string; password: string; targetLanguage: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,

      login: async (email: string, password: string) => {
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (email && password.length >= 6) {
          const user: User = {
            id: 'user-1',
            username: email.split('@')[0],
            email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            targetLanguage: 'english',
            level: 'beginner',
            streakDays: 7,
            totalMinutes: 360,
            totalWords: 120,
            createdAt: new Date().toISOString(),
          };
          set({ user, isLoggedIn: true });
          return true;
        }
        return false;
      },

      register: async (data) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (data.username && data.email && data.password.length >= 6) {
          const user: User = {
            id: `user-${Date.now()}`,
            username: data.username,
            email: data.email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
            targetLanguage: data.targetLanguage,
            level: 'beginner',
            streakDays: 0,
            totalMinutes: 0,
            totalWords: 0,
            createdAt: new Date().toISOString(),
          };
          set({ user, isLoggedIn: true });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ user: null, isLoggedIn: false });
      },

      updateProfile: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
    }),
    {
      name: 'linguaverse-user',
    }
  )
);
