import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Clock, MessageSquare, CreditCard, TrendingUp, Users, DollarSign, AlertCircle, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import { STATUS_LEVELS, getLevelConfig } from '@/utils/levels';
import type { Customer } from '@/types';

// Mock data generator
const generateMockCustomers = (): Customer[] => {
  const names = ['张伟', '李娜', '王强', '刘芳', '陈明', '杨雪', '赵磊', '周婷', '吴军', '郑静', '黄涛', '林婷', '何杰', '罗静', '梁华'];
  const tags = ['咨询项目', '询价', '犹豫中', '已付款', '创业小白', '宝妈', '上班族', '副业', '预算3K', '预算5K'];
  const lastMessages = [
    '这个项目启动需要多少钱？',
    '有案例可以看看吗？',
    '你好，在吗',
    '看了几天朋友圈，很感兴趣',
    '能不能便宜一点',
    '已经付款了',
    '感谢，项目非常实用',
    '有朋友想加你微信',
    '这个项目需要多久回本？',
    '和家人商量一下',
    '好的，我今天付款',
    '先看看你的朋友圈',
    '对副业这个方向很感兴趣',
    '时间成本是多少？',
  ];
  const customers: Customer[] = [];
  for (let i = 1; i <= 15; i++) {
    const level = Math.ceil((15 - i + 2) / 2);
    const createdAt = new Date(Date.now() - (i * 86400000 + Math.random() * 43200000));
    customers.push({
      id: i,
      openid: `wx_${10000 + i}`,
      nickname: names[i - 1],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${names[i - 1]}`,
      level: Math.min(level, 8),
      tags: tags.slice(Math.floor(Math.random() * tags.length), Math.floor(Math.random() * tags.length) + 2).join(','),
      last_message: lastMessages[i - 1],
      last_message_at: new Date(Date.now() - (i * 3600000 + Math.random() * 3600000)).toISOString(),
      last_message_dir: i % 3 === 0 ? 'out' : 'in',
      unread: i % 4 === 0 ? Math.floor(Math.random() * 3) + 1 : 0,
      total_amount: level >= 7 ? (Math.random() * 2000 + 999) : 0,
      created_at: createdAt.toISOString(),
      last_status_at: new Date(Date.now() - (i * 7200000)).toISOString(),
    });
  }
  return customers;
};

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return new Date(isoString).toLocaleDateString('zh-CN');
}

export default function CustomerList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setCustomers(generateMockCustomers());
      setLoading(false);
    }, 500);
  }, []);

  // 状态机漏斗数据
  const levelStats = useMemo(() => {
    return STATUS_LEVELS.map((l) => ({
      ...l,
      count: customers.filter((c) => c.level === l.level).length,
    }));
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const matchLevel = activeLevel === null || c.level === activeLevel;
        const matchSearch = !search || c.nickname.includes(search) || (c.last_message?.includes(search));
        return matchLevel && matchSearch;
      })
      .sort((a, b) => {
        // 未读消息优先，然后按最近消息排序
        const aUnread = a.unread || 0;
        const bUnread = b.unread || 0;
        if (aUnread !== bUnread) return bUnread - aUnread;
        return new Date(b.last_message_at || b.created_at).getTime() - new Date(a.last_message_at || a.created_at).getTime();
      });
  }, [customers, search, activeLevel]);

  const totalCustomers = customers.length;
  const paidCount = customers.filter((c) => c.level >= 7).length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_amount || 0), 0);
  const conversionRate = totalCustomers > 0 ? ((paidCount / totalCustomers) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-dark-300">
      <Header title="客户列表" subtitle={`共 ${totalCustomers} 位客户 · 成交 ${paidCount} 单 · 转化率 ${conversionRate}%`} />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* 核心数据卡片 - 精简 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-dark-200/50 backdrop-blur border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>总客户</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalCustomers}</div>
          </div>
          <div className="bg-dark-200/50 backdrop-blur border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-success text-xs mb-2">
              <CreditCard className="w-3.5 h-3.5" />
              <span>已成交</span>
            </div>
            <div className="text-2xl font-bold text-success">{paidCount}</div>
          </div>
          <div className="bg-dark-200/50 backdrop-blur border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-accent-400 text-xs mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>转化率</span>
            </div>
            <div className="text-2xl font-bold text-accent-400">{conversionRate}%</div>
          </div>
          <div className="bg-dark-200/50 backdrop-blur border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-warning text-xs mb-2">
              <DollarSign className="w-3.5 h-3.5" />
              <span>总金额</span>
            </div>
            <div className="text-2xl font-bold text-warning">¥{totalRevenue.toFixed(0)}</div>
          </div>
        </div>

        {/* L1-L8状态机可视化 */}
        <div className="bg-dark-200/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">客户状态机</h3>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary-400" />
              <span className="text-xs text-gray-400">点击筛选</span>
            </div>
          </div>

          {/* 状态漏斗 */}
          <div className="flex items-stretch gap-1.5 mb-5">
            {levelStats.map((level, idx) => {
              const isActive = activeLevel === level.level;
              const maxCount = Math.max(...levelStats.map((l) => l.count));
              const heightPct = level.count > 0 && maxCount > 0 ? 30 + (level.count / maxCount) * 60 : 30;

              return (
                <div key={level.level} className="flex-1 flex flex-col items-center">
                  {idx > 0 && (
                    <ArrowRight className="w-3 h-3 text-gray-600 mb-1.5 transform rotate-90 md:rotate-0 hidden md:block" />
                  )}
                  <button
                    onClick={() => setActiveLevel(isActive ? null : level.level)}
                    className={`w-full flex flex-col items-center p-2 rounded-xl transition-all ${
                      isActive
                        ? `${level.bg} ${level.border} border`
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {/* 漏斗条形 */}
                    <div
                      className="w-full bg-dark-50 rounded-lg overflow-hidden mb-1.5"
                      style={{ height: '50px' }}
                    >
                      <div
                        className={`w-full rounded-lg transition-all duration-300 ${level.bg}`}
                        style={{ height: `${heightPct}%` }}
                      >
                        <div
                          className="w-full h-full opacity-60"
                          style={{ backgroundColor: `rgba(147, 197, 253, 0.1)` }}
                        />
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${level.color}`}>{level.label}</span>
                    <span className={`text-lg font-bold text-white`}>{level.count}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* 说明 - 紧凑 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-gray-500" />L1 围观</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" />L2 有兴趣</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />L3 咨询</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />L4 询价</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" />L5 犹豫</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" />L6 准备付款</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-success" />L7 已付款</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-accent-500" />L8 转介绍</span>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索客户、消息..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-dark-200 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
            />
          </div>
          {activeLevel !== null && (
            <button
              onClick={() => setActiveLevel(null)}
              className="flex items-center gap-2 px-3 py-2 bg-primary-500/10 text-primary-300 text-sm rounded-lg hover:bg-primary-500/20 transition-colors"
            >
              筛选: {getLevelConfig(activeLevel).label}
              <span className="text-xs">×清除</span>
            </button>
          )}
          <div className="ml-auto text-sm text-gray-400">
            {filteredCustomers.length} 位客户
          </div>
        </div>

        {/* 客户列表 */}
        <div className="bg-dark-200/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">没有匹配的客户</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredCustomers.map((customer) => {
                const levelConf = getLevelConfig(customer.level);
                return (
                  <button
                    key={customer.id}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left group"
                  >
                    {/* 头像 */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={customer.avatar}
                        alt={customer.nickname}
                        className="w-11 h-11 rounded-full bg-dark-50"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-dark-200 ${levelConf.dot}`}
                      />
                    </div>

                    {/* 主信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">{customer.nickname}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${levelConf.bg} ${levelConf.color}`}>
                          {levelConf.label}
                        </span>
                        {customer.unread && customer.unread > 0 ? (
                          <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                            {customer.unread}条未读
                          </span>
                        ) : null}
                        {customer.total_amount && customer.total_amount > 0 ? (
                          <span className="text-xs px-1.5 py-0.5 bg-success/10 text-success rounded-full">
                            ¥{customer.total_amount.toFixed(0)}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-400 truncate">
                        <span className={customer.last_message_dir === 'in' ? '' : 'text-primary-300/70'}>
                          {customer.last_message_dir === 'out' ? '我: ' : ''}
                          {customer.last_message}
                        </span>
                      </p>
                    </div>

                    {/* 右侧信息 */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {/* 标签 */}
                      <div className="hidden md:flex items-center gap-1.5 max-w-xs">
                        {customer.tags.split(',').slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 bg-dark-50 text-gray-400 rounded-full"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                      {/* 时间 */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {customer.last_message_at ? formatRelativeTime(customer.last_message_at) : '-'}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* AI提示 - 需关注的客户 */}
        <div className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-white">AI 成交提示</h3>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-3 p-2.5 bg-dark-50 rounded-lg">
              <span className="text-xs px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded flex-shrink-0 mt-0.5">L5 犹豫</span>
              <div className="text-gray-300">
                <span className="text-white font-medium">张伟</span> 正在犹豫，已在该阶段停留 24 小时，建议立即跟进
              </div>
            </div>
            <div className="flex items-start gap-3 p-2.5 bg-dark-50 rounded-lg">
              <span className="text-xs px-1.5 py-0.5 bg-primary-500/20 text-primary-400 rounded flex-shrink-0 mt-0.5">L6 准备付款</span>
              <div className="text-gray-300">
                <span className="text-white font-medium">陈明</span> 处于付款阶段，建议发送收款二维码
              </div>
            </div>
            <div className="flex items-start gap-3 p-2.5 bg-dark-50 rounded-lg">
              <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded flex-shrink-0 mt-0.5">L4 询价</span>
              <div className="text-gray-300">
                <span className="text-white font-medium">3位</span> 客户处于询价阶段，可推送限时优惠
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
