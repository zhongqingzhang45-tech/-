export interface Customer {
  id: number;
  openid: string;
  nickname: string;
  avatar: string;
  level: number; // L1-L8 状态机
  tags: string;
  last_message?: string; // 最近一条消息
  last_message_at?: string; // 最近消息时间
  last_message_dir?: 'in' | 'out'; // 消息方向
  unread?: number; // 未读消息数
  total_amount?: number; // 累计成交金额
  created_at: string;
  last_status_at?: string; // 进入当前状态时间
}

export interface CustomerLifecycle {
  id: number;
  customer_id: number;
  from_level: number;
  to_level: number;
  reason: string;
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
  customer_name: string;
  amount: number;
  status: 'pending' | 'paid' | 'refunded';
  payment_method?: string;
  product_name?: string;
  paid_at?: string;
}

export interface KnowledgeItem {
  id: number;
  question: string;
  answer: string;
  keywords: string;
  priority: number;
  level: number; // 触发L1-L8
  created_at: string;
}

export interface FollowUpRule {
  id: number;
  level: number; // 触发的L阶段
  name: string;
  content: string;
  delay_hours: number; // 延迟发送时间
  enabled: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalCustomers: number;
  todayRevenue: number;
  totalRevenue: number;
  paidCount: number;
  conversionRate: number;
}
