import { useState } from 'react';
import { Search, CreditCard, ChevronDown } from 'lucide-react';
import Header from '@/components/layout/Header';
import type { Order } from '@/types';

const MOCK_ORDERS: Order[] = [
  { id: 1001, customer_id: 7, customer_name: '张伟', amount: 1299, status: 'paid', payment_method: 'wechat', product_name: '专业版 + 陪跑', paid_at: '2025-06-08 14:32:00' },
  { id: 1002, customer_id: 8, customer_name: '李娜', amount: 599, status: 'paid', payment_method: 'alipay', product_name: '专业版', paid_at: '2025-06-08 11:18:00' },
  { id: 1003, customer_id: 9, customer_name: '王强', amount: 299, status: 'paid', payment_method: 'wechat', product_name: '基础版', paid_at: '2025-06-07 20:05:00' },
  { id: 1004, customer_id: 10, customer_name: '刘芳', amount: 599, status: 'pending', payment_method: '', product_name: '专业版', paid_at: '2025-06-07 15:42:00' },
  { id: 1005, customer_id: 11, customer_name: '陈明', amount: 1299, status: 'refunded', payment_method: 'wechat', product_name: '专业版 + 陪跑', paid_at: '2025-06-06 09:20:00' },
  { id: 1006, customer_id: 12, customer_name: '杨雪', amount: 299, status: 'paid', payment_method: 'alipay', product_name: '基础版', paid_at: '2025-06-06 08:47:00' },
];

export default function Payments() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all');

  const filteredOrders = MOCK_ORDERS.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search && !o.customer_name.includes(search)) return false;
    return true;
  });

  const totalAmount = filteredOrders.reduce((sum, o) => sum + (o.status === 'paid' ? o.amount : 0), 0);
  const paidCount = filteredOrders.filter((o) => o.status === 'paid').length;
  const pendingCount = filteredOrders.filter((o) => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-dark-300">
      <Header title="支付记录" subtitle={`${paidCount} 笔已成交 · ¥${totalAmount.toFixed(0)}`} />

      <div className="p-6 space-y-5 animate-fade-in">
        {/* 概览卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-dark-200/50 backdrop-blur-xl border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">成交订单</p>
            <p className="text-2xl font-bold text-white">{paidCount}</p>
          </div>
          <div className="bg-dark-200/50 backdrop-blur-xl border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">成交金额</p>
            <p className="text-2xl font-bold text-success">¥{totalAmount.toFixed(0)}</p>
          </div>
          <div className="bg-dark-200/50 backdrop-blur-xl border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">待付款</p>
            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          </div>
          <div className="bg-dark-200/50 backdrop-blur-xl border border-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">客单价</p>
            <p className="text-2xl font-bold text-primary-300">
              ¥{paidCount > 0 ? (totalAmount / paidCount).toFixed(0) : '0'}
            </p>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索客户姓名..."
              className="w-full pl-9 pr-4 py-2.5 bg-dark-200 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
            />
          </div>

          {/* 筛选 */}
          <div className="flex items-center gap-1.5">
            {[
              { key: 'all', label: '全部' },
              { key: 'paid', label: '已付款' },
              { key: 'pending', label: '待付款' },
              { key: 'refunded', label: '已退款' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  filter === f.key
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 列表 */}
        <div className="bg-dark-200/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 text-xs text-gray-500">
            <div className="flex-1">订单号</div>
            <div className="w-20">客户</div>
            <div className="w-32">产品</div>
            <div className="w-24 text-right">金额</div>
            <div className="w-24 text-right">方式</div>
            <div className="w-20 text-right">状态</div>
            <div className="w-40 text-right">时间</div>
          </div>
          {filteredOrders.map((o) => (
            <div
              key={o.id}
              className="flex items-center gap-3 px-4 py-4 border-b border-white/5 hover:bg-white/5 transition-colors text-sm text-white"
            >
              <div className="flex-1 text-gray-400">#{o.id}</div>
              <div className="w-20">{o.customer_name}</div>
              <div className="w-32 text-gray-300">{o.product_name}</div>
              <div className="w-24 text-right font-semibold text-warning">¥{o.amount.toFixed(0)}</div>
              <div className="w-24 text-right text-gray-400">
                {o.payment_method === 'wechat' ? '微信' : o.payment_method === 'alipay' ? '支付宝' : '—'}
              </div>
              <div className="w-20 text-right">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    o.status === 'paid' ? 'bg-success/10 text-success' :
                    o.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {o.status === 'paid' ? '已付款' : o.status === 'pending' ? '待付款' : '已退款'}
                </span>
              </div>
              <div className="w-40 text-right text-gray-500 text-xs">{o.paid_at}</div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500">暂无订单</div>
          )}
        </div>
      </div>
    </div>
  );
}
