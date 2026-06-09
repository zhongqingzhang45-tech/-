import { useEffect, useState } from 'react';
import { TrendingUp, Users, MessageSquare, ShoppingCart, DollarSign, Eye } from 'lucide-react';
import Header from '@/components/layout/Header';
import StatCard from '@/components/common/StatCard';
import { useDashboardStore } from '@/stores';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function Analytics() {
  const { stats, funnel, fetchDashboardStats, fetchFunnelData } = useDashboardStore();

  useEffect(() => {
    fetchDashboardStats();
    fetchFunnelData();
  }, []);

  // Mock trend data
  const trendData = [
    { date: '周一', customers: 42, conversations: 128, orders: 8 },
    { date: '周二', customers: 55, conversations: 145, orders: 12 },
    { date: '周三', customers: 48, conversations: 132, orders: 9 },
    { date: '周四', customers: 62, conversations: 168, orders: 15 },
    { date: '周五', customers: 58, conversations: 155, orders: 14 },
    { date: '周六', customers: 72, conversations: 189, orders: 18 },
    { date: '周日', customers: 65, conversations: 172, orders: 16 },
  ];

  // Mock source data
  const sourceData = [
    { name: '朋友圈', value: 35 },
    { name: '微信群', value: 28 },
    { name: '私聊推荐', value: 22 },
    { name: '其他', value: 15 },
  ];

  const COLORS = ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD'];

  // Funnel data
  const funnelChartData = funnel
    ? funnel.stages.map((stage, i) => ({
        name: stage,
        value: funnel.counts[i],
      }))
    : [];

  return (
    <div className="min-h-screen">
      <Header title="数据分析" subtitle="监控营销效果和转化漏斗" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="总客户数"
            value={stats?.totalCustomers ?? 0}
            icon={<Users className="w-5 h-5 text-primary-400" />}
            trend={{ value: 23.5, isPositive: true }}
          />
          <StatCard
            title="转化率"
            value={`${stats?.conversionRate ?? 0}%`}
            icon={<TrendingUp className="w-5 h-5 text-success" />}
            trend={{ value: 5.2, isPositive: true }}
          />
          <StatCard
            title="总订单数"
            value={stats?.todayOrders ? stats.todayOrders * 12 : 0}
            icon={<ShoppingCart className="w-5 h-5 text-accent-400" />}
            trend={{ value: 18.7, isPositive: true }}
          />
          <StatCard
            title="总收入"
            value={`¥${(stats?.todayRevenue ?? 0) * 12 + 12580 ? (stats?.todayRevenue ?? 0) * 12 + 12580 : 0}`}
            icon={<DollarSign className="w-5 h-5 text-warning" />}
            trend={{ value: 12.3, isPositive: true }}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <div className="lg:col-span-2 bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">7日趋势</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #1E293B',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="customers"
                    stroke="#6366F1"
                    fillOpacity={1}
                    fill="url(#colorCustomers)"
                    name="新增客户"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversations"
                    stroke="#8B5CF6"
                    fillOpacity={1}
                    fill="url(#colorConversations)"
                    name="对话数"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Source Pie Chart */}
          <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">获客来源</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sourceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #1E293B',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel Chart */}
          <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">转化漏斗</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelChartData} layout="vertical">
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
                    {funnelChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders Bar Chart */}
          <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">每日订单</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #1E293B',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} name="订单数" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">AI性能指标</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <Eye className="w-6 h-6 text-primary-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">94.5%</p>
              <p className="text-xs text-gray-400">意图识别准确率</p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <MessageSquare className="w-6 h-6 text-accent-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">1.2s</p>
              <p className="text-xs text-gray-400">平均响应时间</p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <TrendingUp className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">86.3%</p>
              <p className="text-xs text-gray-400">问题解决率</p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <Users className="w-6 h-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">12.5%</p>
              <p className="text-xs text-gray-400">人工介入率</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
