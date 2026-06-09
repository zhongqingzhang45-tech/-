import { useEffect, useState } from 'react';
import { RefreshCw, Eye, ThumbsUp, MessageSquare, Share2, ShoppingCart, DollarSign, ExternalLink, Zap } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

const PLATFORM_NAMES = {
  xiaohongshu: '小红书',
  douyin: '抖音',
  video_haokong: '视频号',
  kuaisou: '快手',
};

const PLATFORM_COLORS = {
  xiaohongshu: 'text-pink-400 bg-pink-500/10',
  douyin: 'text-blue-400 bg-blue-500/10',
  video_haokong: 'text-green-400 bg-green-500/10',
  kuaisou: 'text-orange-400 bg-orange-500/10',
};

export default function Publish() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/publish');
      if (res.data.success) {
        setRecords(res.data.data.list);
        setStats(res.data.data.stats);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">发布记录</h1>
          <p className="text-sm text-gray-400 mt-1">
            已发布 {stats.published_count || 0} 条 · 今日 {stats.today_count || 0} 条
          </p>
        </div>
        <button
          onClick={loadRecords}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-400 text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          刷新
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <Eye className="w-3.5 h-3.5" />
            总播放
          </div>
          <p className="text-xl font-bold text-white">{(stats.total_views || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            总佣金
          </div>
          <p className="text-xl font-bold text-green-400">¥{(stats.total_commission || 0).toFixed(0)}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <ShoppingCart className="w-3.5 h-3.5" />
            总GMV
          </div>
          <p className="text-xl font-bold text-yellow-400">¥{(stats.total_gmv || 0).toFixed(0)}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
            <Zap className="w-3.5 h-3.5" />
            转化率
          </div>
          <p className="text-xl font-bold text-orange-400">
            {stats.total_views > 0 ? ((stats.total_gmv || 0) / stats.total_views * 100).toFixed(2) : 0}%
          </p>
        </div>
      </div>

      {/* Records */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-3"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))
        ) : records.length === 0 ? (
          <div className="py-12 text-center">
            <Share2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">还没有发布记录</p>
          </div>
        ) : (
          records.map((r) => (
            <div key={r.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs rounded ${PLATFORM_COLORS[r.platform] || 'text-gray-400 bg-gray-700'}`}>
                      {PLATFORM_NAMES[r.platform] || r.platform}
                    </span>
                    <span className="text-sm text-white font-medium">{r.content_title || '无标题'}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {r.account_name} · {r.created_at ? new Date(r.created_at).toLocaleString('zh-CN') : '-'}
                  </p>
                </div>
                {r.platform_url && (
                  <a
                    href={r.platform_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-6 gap-2">
                <Stat item icon={<Eye className="w-3 h-3" />} value={r.views || 0} label="播放" />
                <Stat item icon={<ThumbsUp className="w-3 h-3" />} value={r.likes || 0} label="点赞" />
                <Stat item icon={<MessageSquare className="w-3 h-3" />} value={r.comments || 0} label="评论" />
                <Stat item icon={<Share2 className="w-3 h-3" />} value={r.shares || 0} label="分享" />
                <Stat item icon={<ShoppingCart className="w-3 h-3" />} value={r.clicks || 0} label="点击" />
                <Stat item icon={<DollarSign className="w-3 h-3" />} value={`¥${(r.commission || 0).toFixed(0)}`} label="佣金" color="text-green-400" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ icon, value, label, color = 'text-gray-400' }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={color}>{icon}</span>
      <span className="text-sm text-white font-medium">{typeof value === 'number' ? value.toLocaleString() : value}</span>
    </div>
  );
}
