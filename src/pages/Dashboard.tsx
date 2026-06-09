import { useEffect } from 'react';
import { Users, MessageSquare, ShoppingCart, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import StatCard from '@/components/common/StatCard';
import { useDashboardStore } from '@/stores';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from 'recharts';

export default function Dashboard() {
  const { stats, funnel, fetchDashboardStats, fetchFunnelData } = useDashboardStore();

  useEffect(() => {
    fetchDashboardStats();
    fetchFunnelData();
  }, []);

  const funnelData = funnel
    ? funnel.stages.map((stage, i) => ({
        name: stage,
        value: funnel.counts[i],
      }))
    : [];

  return (
    <div className="min-h-screen">
      <Header title="控制台" subtitle="系统运行状态正常" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="今日新增客户"
            value={stats?.todayCustomers ?? 0}
            icon={<Users className="w-5 h-5 text-primary-400" />}
            trend={{ value: 12.5, isPositive: true }}
            gradient="from-primary-500/20 to-accent-500/20"
          />
          <StatCard
            title="今日对话数"
            value={stats?.todayConversations ?? 0}
            icon={<MessageSquare className="w-5 h-5 text-accent-400" />}
            trend={{ value: 8.2, isPositive: true }}
            gradient="from-accent-500/20 to-primary-500/20"
          />
          <StatCard
            title="今日订单数"
            value={stats?.todayOrders ?? 0}
            icon={<ShoppingCart className="w-5 h-5 text-success" />}
            trend={{ value: 5.1, isPositive: true }}
            gradient="from-success/20 to-emerald-500/20"
          />
          <StatCard
            title="今日成交金额"
            value={`¥${stats?.todayRevenue?.toFixed(2) ?? '0.00'}`}
            icon={<DollarSign className="w-5 h-5 text-warning" />}
            trend={{ value: 15.3, isPositive: true }}
            gradient="from-warning/20 to-amber-500/20"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Funnel Chart */}
          <div className="lg:col-span-2 bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">转化漏斗</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis type="number" stroke="#64748B" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #1E293B',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {funnelData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#gradient${index})`} />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="gradient0" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#A78BFA" />
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#A78BFA" />
                      <stop offset="100%" stopColor="#C4B5FD" />
                    </linearGradient>
                    <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Status */}
          <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">AI智能体状态</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-dark-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                  <span className="text-sm text-white">运行中</span>
                </div>
                <span className="text-xs text-gray-400">在线 8小时</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">今日回复</span>
                  <span className="text-white">{stats?.todayConversations ?? 0} 次</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">平均响应</span>
                  <span className="text-white">1.2 秒</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">准确率</span>
                  <span className="text-white">94.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">高意向客户</span>
                  <span className="text-success">{stats?.highIntentCustomers ?? 0} 人</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>转化率 {stats?.conversionRate ?? 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">待处理事项</h3>
            <span className="px-2 py-1 bg-warning/20 text-warning text-xs rounded-full">3 项待处理</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-dark-50 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-primary-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">客户「李娜」需要人工介入</p>
                <p className="text-xs text-gray-400">14:32 发起砍价请求</p>
              </div>
              <span className="text-xs text-gray-500">10分钟前</span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-dark-50 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
              <div className="p-2 bg-warning/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">客户「陈明」长时间未回复</p>
                <p className="text-xs text-gray-400">14:20 发送产品介绍后无响应</p>
              </div>
              <span className="text-xs text-gray-500">22分钟前</span>
            </div>

            <div className="flex items-center gap-4 p-4 bg-dark-50 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
              <div className="p-2 bg-success/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">客户「张伟」已付款成功</p>
                <p className="text-xs text-gray-400">14:15 完成订单支付 ¥299</p>
              </div>
              <span className="text-xs text-gray-500">27分钟前</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
