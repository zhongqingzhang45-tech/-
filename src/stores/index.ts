import { create } from 'zustand';
import type { Customer } from '@/types';

interface AppState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  darkMode: true,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

interface CustomerState {
  customers: Customer[];
  currentCustomer: Customer | null;
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  fetchCustomers: (params?: { page?: number; limit?: number; search?: string; level?: number }) => void;
}

// 一个简化的客户store（目前前端mock数据足够）
export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  currentCustomer: null,
  loading: false,
  total: 0,
  page: 1,
  limit: 10,
  fetchCustomers: () => set({}),
}));
