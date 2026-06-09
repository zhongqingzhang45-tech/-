import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronRight, Star, Tag as TagIcon } from 'lucide-react';
import Header from '@/components/layout/Header';
import DataTable from '@/components/common/DataTable';
import { useCustomerStore } from '@/stores';
import type { Customer } from '@/types';

const levelLabels = ['潜在', '低意向', '中意向', '高意向', '已购买'];
const levelColors = ['text-gray-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-success'];

export default function Customers() {
  const navigate = useNavigate();
  const { customers, loading, total, page, limit, fetchCustomers } = useCustomerStore();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<number | undefined>();

  useEffect(() => {
    fetchCustomers({ page, limit, search, level });
  }, [page, limit, search, level]);

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchCustomers({ page: 1, limit, search: value, level });
  };

  const handleLevelFilter = (value: number | undefined) => {
    setLevel(value);
    fetchCustomers({ page: 1, limit, search, level: value });
  };

  const columns = [
    {
      key: 'nickname',
      title: '客户',
      width: '25%',
      render: (item: Customer) => (
        <div className="flex items-center gap-3">
          <img
            src={item.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.nickname}`}
            alt={item.nickname}
            className="w-9 h-9 rounded-full bg-dark-50"
          />
          <div>
            <p className="text-white font-medium">{item.nickname}</p>
            <p className="text-xs text-gray-500">{item.openid}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'level',
      title: '意向等级',
      width: '15%',
      render: (item: Customer) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i < item.level ? 'text-warning fill-warning' : 'text-gray-600'}`}
            />
          ))}
          <span className={`ml-1 text-xs ${levelColors[item.level]}`}>{levelLabels[item.level]}</span>
        </div>
      ),
    },
    {
      key: 'tags',
      title: '标签',
      width: '30%',
      render: (item: Customer) => (
        <div className="flex flex-wrap gap-1">
          {item.tags ? (
            item.tags.split(',').map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-primary-500/20 text-primary-300 text-xs rounded-full"
              >
                {tag.trim()}
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-sm">暂无标签</span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      title: '添加时间',
      width: '20%',
      render: (item: Customer) => (
        <span className="text-gray-400 text-sm">
          {new Date(item.created_at).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'action',
      title: '',
      width: '10%',
      render: () => (
        <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header title="客户管理" subtitle={`共 ${total} 位客户`} />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索客户昵称或ID..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-dark-200 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>

          {/* Level filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={level ?? ''}
              onChange={(e) => handleLevelFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="bg-dark-200 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500/50 transition-colors"
            >
              <option value="">全部等级</option>
              {levelLabels.map((label, i) => (
                <option key={i} value={i}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={customers}
          loading={loading}
          page={page}
          limit={limit}
          total={total}
          onPageChange={(p) => fetchCustomers({ page: p, limit, search, level })}
          onRowClick={(item) => navigate(`/customers/${item.id}`)}
        />
      </div>
    </div>
  );
}
