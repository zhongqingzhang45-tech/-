export interface Customer {
  id: number;
  openid: string;
  nickname: string;
  avatar: string;
  level: number;
  tags: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  customer_id: number;
  status: string;
  started_at: string;
  ended_at?: string;
  message_count?: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  content: string;
  direction: 'in' | 'out';
  source: 'ai' | 'manual' | 'customer';
  created_at: string;
}

export interface Order {
  id: number;
  customer_id: number;
  amount: number;
  status: 'pending' | 'paid' | 'refunded';
  payment_method?: string;
  paid_at?: string;
}

export interface KnowledgeItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  priority: number;
}

export interface Template {
  id: number;
  name: string;
  content: string;
  category: string;
  created_at: string;
}

export interface FlowNode {
  id: number;
  type: string;
  config: string;
  position_x: number;
  position_y: number;
}

export interface DashboardStats {
  todayCustomers: number;
  todayConversations: number;
  todayOrders: number;
  todayRevenue: number;
  conversionRate: number;
  highIntentCustomers: number;
  totalCustomers: number;
}

export interface FunnelData {
  stages: string[];
  counts: number[];
}
