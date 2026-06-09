import { useEffect, useState } from 'react';
import { Search, Filter, Star, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

const PLATFORM_NAMES = {
  douyin: '抖音精选联盟',
  jingdong: '京东联盟',
  taobao: '淘宝联盟',
  pinduoduo: '拼多多联盟',
};

const PLATFORM_COLORS = {
  douyin: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  jingdong: 'text-red-400 bg-red-500/10 border-red-500/20',
  taobao: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  pinduoduo: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, [platform]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/top?limit=50' + (platform ? `&platform=${platform}` : ''));
      if (res.data.success) setProducts(res.data.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const filtered = products.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">爆品池</h1>
          <p className="text-sm text-gray-400 mt-1">发现高潜力带货商品</p>
        </div>
        <button
          onClick={loadProducts}
          className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 text-orange-400 text-sm rounded-lg hover:bg-orange-500/30 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          刷新
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索商品..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPlatform('')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${!platform ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
          >
            全部
          </button>
          {Object.entries(PLATFORM_NAMES).map(([key, name]) => (
            <button
              key={key}
              onClick={() => setPlatform(key)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${platform === key ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 animate-pulse">
              <div className="h-32 bg-gray-700 rounded-lg mb-3" />
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">没有找到商品</div>
        ) : (
          filtered.map((p) => (
            <div key={p.product_id} className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-orange-500/30 transition-colors group">
              {/* Image */}
              <div className="relative h-36 bg-gray-700/50 overflow-hidden">
                <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { e.target.style.display = 'none'; }} />
                {/* Platform badge */}
                <span className={`absolute top-2 left-2 px-2 py-0.5 text-xs rounded border ${PLATFORM_COLORS[p.platform]}`}>
                  {PLATFORM_NAMES[p.platform]}
                </span>
                {/* Rank score */}
                <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
                  <Star className="w-3 h-3 text-yellow-400 inline mr-0.5" />
                  {p.rank_score?.toFixed(0)}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm text-white line-clamp-2 mb-2">{p.title}</p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-white">¥{p.price}</span>
                  <span className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                    佣金{p.commission_rate * 100}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>销量 {p.sales_count?.toLocaleString()}</span>
                  <span className="text-orange-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    +{p.sales_increase}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
