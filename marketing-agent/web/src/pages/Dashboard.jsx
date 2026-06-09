import { useEffect, useState } from 'react';
import { Package, FileText, Eye, DollarSign, TrendingUp, Flame, Zap, Clock, ArrowRight } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

const PLATFORM_NAMES = {
  douyin: '抖音精选联盟',
  jingdong: '京东联盟',
  taobao: '淘宝联盟',
  pinduoduo: '拼多多联盟',
};

const PLATFORM_COLORS = {
  douyin: 'text-pink-400 bg-pink-500/10',
  jingdong: 'text-red-400 bg-red-500/10',
  taobao: 'text-orange-400 bg-orange-500/10',
  pinduoduo: 'text-yellow-400 bg-yellow-500/10',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [recentContents, setRecentContents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes, contentsRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/products/top?limit=5'),
        api.get('/contents?limit=5'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (productsRes.data.success) setTopProducts(productsRes.data.data);
      if (contentsRes.data.success) setRecentContents(contentsRes.data.data.list);
    } catch (e) {
      console.error('加载失败', e);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-800 rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-800 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">AI爆品发现 + 内容工厂</h1>
          <p className="text-sm text-gray-400 mt-1">全自动化带货矩阵系统 · V3.0</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">最后更新: 刚刚</span>
          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-orange-500/20 text-orange-400 text-sm rounded-lg hover:bg-orange-500/30 transition-colors"
          >
            刷新数据
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Package className="w-5 h-5 text-orange-400" />}
          label="爆品总数"
          value={stats?.products?.total || 0}
          trend="+12"
          color="from-orange-500/20 to-red-500/20"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-blue-400" />}
          label="内容库"
          value={stats?.contents?.total || 0}
          trend="+8"
          color="from-blue-500/20 to-cyan-500/20"
        />
        <StatCard
          icon={<Eye className="w-5 h-5 text-purple-400" />}
          label="总播放"
          value={formatNumber(stats?.publish?.total_views || 0)}
          trend="+23%"
          color="from-purple-500/20 to-pink-500/20"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-green-400" />}
          label="预估佣金"
          value={`¥${(stats?.publish?.total_commission || 0).toFixed(0)}`}
          trend="+18%"
          color="from-green-500/20 to-emerald-500/20"
        />
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h2 className="font-semibold text-white">Top 爆品</h2>
            </div>
            <a href="/products" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-gray-700/50">
            {topProducts.slice(0, 5).map((p, i) => (
              <div key={p.product_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-700/20 transition-colors">
                <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-orange-500 text-white' : i === 1 ? 'bg-gray-500 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{p.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${PLATFORM_COLORS[p.platform] || 'text-gray-400 bg-gray-700'}`}>
                      {PLATFORM_NAMES[p.platform] || p.platform}
                    </span>
                    <span className="text-xs text-gray-500">¥{p.price}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-400">¥{(p.price * p.commission_rate).toFixed(0)}</p>
                  <p className="text-xs text-gray-500">佣金{p.commission_rate * 100}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Contents */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <h2 className="font-semibold text-white">最近内容</h2>
            </div>
            <a href="/contents" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div className="divide-y divide-gray-700/50">
            {recentContents.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">暂无内容， 点击右上角生成</div>
            ) : recentContents.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-700/20 transition-colors">
                <div className={`w-2 h-2 rounded-full ${
                  c.content_type === 'xiaohongshu' ? 'bg-pink-500' :
                  c.content_type === 'douyin' ? 'bg-blue-500' : 'bg-purple-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{c.title || '无标题'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{c.content_type}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      c.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      c.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {c.status === 'published' ? '已发布' : c.status === 'draft' ? '草稿' : '待发布'}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{formatTime(c.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Publish Stats */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <h2 className="font-semibold text-white">发布数据概览</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{formatNumber(stats?.publish?.total_views || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">总播放</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-pink-400">{stats?.publish?.published_count || 0}</p>
            <p className="text-xs text-gray-500 mt-1">发布数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{stats?.publish?.today_count || 0}</p>
            <p className="text-xs text-gray-500 mt-1">今日发布</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">¥{stats?.publish?.total_gmv?.toFixed(0) || 0}</p>
            <p className="text-xs text-gray-500 mt-1">总GMV</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">¥{stats?.publish?.total_commission?.toFixed(0) || 0}</p>
            <p className="text-xs text-gray-500 mt-1">预估佣金</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-400">{((stats?.commission_rate || 0) * 100).toFixed(0)}%</p>
            <p className="text-xs text-gray-500 mt-1">转化率</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} border border-white/5 rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-xs text-green-400 flex items-center gap-0.5">
          <TrendingUp className="w-3 h-3" /> {trend}
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function formatNumber(num) {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num;
}

function formatTime(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  return d.toLocaleDateString('zh-CN');
}
