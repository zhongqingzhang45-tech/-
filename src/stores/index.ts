import { create } from 'zustand';
import type { Customer, DashboardStats, FunnelData } from '@/types';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

interface AppState {
  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Sidebar
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

  fetchCustomers: (params?: { page?: number; limit?: number; search?: string; level?: number }) => Promise<void>;
  fetchCustomerById: (id: number) => Promise<void>;
  updateCustomerTags: (id: number, tags: string[]) => Promise<void>;
  updateCustomerLevel: (id: number, level: number) => Promise<void>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  currentCustomer: null,
  loading: false,
  total: 0,
  page: 1,
  limit: 10,

  fetchCustomers: async (params) => {
    set({ loading: true });
    try {
      const { page = 1, limit = 10, search = '', level } = params || {};
      const response = await api.get('/customers', {
        params: { page, limit, search, level },
      });
      if (response.data.success) {
        set({
          customers: response.data.data.list,
          total: response.data.data.total,
          page: response.data.data.page,
          limit: response.data.data.limit,
        });
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchCustomerById: async (id) => {
    set({ loading: true });
    try {
      const response = await api.get(`/customers/${id}`);
      if (response.data.success) {
        set({ currentCustomer: response.data.data.customer });
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      set({ loading: false });
    }
  },

  updateCustomerTags: async (id, tags) => {
    try {
      await api.put(`/customers/${id}/tags`, { tags });
      await get().fetchCustomers();
    } catch (error) {
      console.error('Error updating tags:', error);
    }
  },

  updateCustomerLevel: async (id, level) => {
    try {
      await api.put(`/customers/${id}/level`, { level });
      await get().fetchCustomers();
    } catch (error) {
      console.error('Error updating level:', error);
    }
  },
}));

interface DashboardState {
  stats: DashboardStats | null;
  funnel: FunnelData | null;
  loading: boolean;

  fetchDashboardStats: () => Promise<void>;
  fetchFunnelData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  funnel: null,
  loading: false,

  fetchDashboardStats: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/analytics/dashboard');
      if (response.data.success) {
        set({ stats: response.data.data });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchFunnelData: async () => {
    try {
      const response = await api.get('/analytics/funnel');
      if (response.data.success) {
        set({ funnel: response.data.data });
      }
    } catch (error) {
      console.error('Error fetching funnel:', error);
    }
  },
}));

interface KnowledgeState {
  items: any[];
  loading: boolean;

  fetchKnowledge: (category?: string) => Promise<void>;
  addKnowledge: (data: { question: string; answer: string; category?: string; priority?: number }) => Promise<void>;
  updateKnowledge: (id: number, data: { question: string; answer: string; category?: string; priority?: number }) => Promise<void>;
  deleteKnowledge: (id: number) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  items: [],
  loading: false,

  fetchKnowledge: async (category) => {
    set({ loading: true });
    try {
      const response = await api.get('/knowledge', { params: { category } });
      if (response.data.success) {
        set({ items: response.data.data });
      }
    } catch (error) {
      console.error('Error fetching knowledge:', error);
    } finally {
      set({ loading: false });
    }
  },

  addKnowledge: async (data) => {
    try {
      await api.post('/knowledge', data);
      await get().fetchKnowledge();
    } catch (error) {
      console.error('Error adding knowledge:', error);
    }
  },

  updateKnowledge: async (id, data) => {
    try {
      await api.put(`/knowledge/${id}`, data);
      await get().fetchKnowledge();
    } catch (error) {
      console.error('Error updating knowledge:', error);
    }
  },

  deleteKnowledge: async (id) => {
    try {
      await api.delete(`/knowledge/${id}`);
      await get().fetchKnowledge();
    } catch (error) {
      console.error('Error deleting knowledge:', error);
    }
  },
}));

interface TemplateState {
  items: any[];
  loading: boolean;

  fetchTemplates: (category?: string) => Promise<void>;
  addTemplate: (data: { name: string; content: string; category?: string }) => Promise<void>;
  updateTemplate: (id: number, data: { name: string; content: string; category?: string }) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  items: [],
  loading: false,

  fetchTemplates: async (category) => {
    set({ loading: true });
    try {
      const response = await api.get('/templates', { params: { category } });
      if (response.data.success) {
        set({ items: response.data.data });
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      set({ loading: false });
    }
  },

  addTemplate: async (data) => {
    try {
      await api.post('/templates', data);
      await get().fetchTemplates();
    } catch (error) {
      console.error('Error adding template:', error);
    }
  },

  updateTemplate: async (id, data) => {
    try {
      await api.put(`/templates/${id}`, data);
      await get().fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
    }
  },

  deleteTemplate: async (id) => {
    try {
      await api.delete(`/templates/${id}`);
      await get().fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  },
}));
