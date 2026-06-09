import { useState, useEffect } from 'react';
import { User, Key, Bell, Database, Plus, Trash2, Save } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

const PLATFORMS = [
  { key: 'xiaohongshu', name: '小红书', color: 'bg-pink-500' },
  { key: 'douyin', name: '抖音', color: 'bg-blue-500' },
  { key: 'video_haokong', name: '视频号', color: 'bg-green-500' },
  { key: 'kuaisou', name: '快手', color: 'bg-orange-500' },
];

export default function Settings() {
  const [accounts, setAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('accounts');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      if (res.data.success) setAccounts(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const addAccount = async () => {
    const platform = prompt('输入平台 (xiaohongshu/douyin/video_haokong/kuaisou):');
    if (!platform) return;
    const name = prompt('输入账号名称:');
    if (!name) return;

    try {
      await api.post('/accounts', {
        platform,
        account_name: name,
        cookies: '',
        status: 'active',
      });
      await loadAccounts();
    } catch (e) {
      console.error(e);
    }
  };

  const tabs = [
    { key: 'accounts', label: '账号管理', icon: User },
    { key: 'api', label: 'API配置', icon: Key },
    { key: 'notifications', label: '通知设置', icon: Bell },
    { key: 'data', label: '数据管理', icon: Database },
  ];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">设置</h1>
        <p className="text-sm text-gray-400 mt-1">配置账号、API和系统参数</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-800/50 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab.key
                ? 'bg-orange-500/20 text-orange-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Accounts */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">管理多平台多账号，用于矩阵发布</p>
            <button
              onClick={addAccount}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 text-orange-400 text-sm rounded-lg hover:bg-orange-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              添加账号
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">还没有账号，点击右上角添加</div>
          ) : (
            <div className="space-y-2">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${PLATFORMS.find(p => p.key === acc.platform)?.color || 'bg-gray-500'}`} />
                    <div>
                      <p className="text-sm text-white font-medium">{acc.account_name}</p>
                      <p className="text-xs text-gray-500">{PLATFORMS.find(p => p.key === acc.platform)?.name || acc.platform}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      acc.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {acc.status === 'active' ? '正常' : '异常'}
                    </span>
                    <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* API Config */}
      {activeTab === 'api' && (
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm text-gray-400 mb-2">DeepSeek API Key</label>
            <input
              type="password"
              placeholder="sk-xxxxx"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
            />
            <p className="text-xs text-gray-500 mt-1">用于AI内容生成和商品分析</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Playwright 配置</label>
            <input
              type="text"
              placeholder="chromium / firefox / webkit"
              defaultValue="chromium"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors">
            <Save className="w-4 h-4" />
            保存配置
          </button>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-4 max-w-lg">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
            <div>
              <p className="text-sm text-white">发布成功通知</p>
              <p className="text-xs text-gray-500">内容发布成功后发送通知</p>
            </div>
            <Toggle defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
            <div>
              <p className="text-sm text-white">爆品预警</p>
              <p className="text-xs text-gray-500">发现新的高潜力爆品时通知</p>
            </div>
            <Toggle defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
            <div>
              <p className="text-sm text-white">佣金到账通知</p>
              <p className="text-xs text-gray-500">有新的佣金收入时通知</p>
            </div>
            <Toggle />
          </div>
        </div>
      )}

      {/* Data */}
      {activeTab === 'data' && (
        <div className="space-y-4 max-w-lg">
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-white">数据库备份</p>
                <p className="text-xs text-gray-500">手动备份所有数据</p>
              </div>
              <button className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-sm rounded-lg hover:bg-blue-500/30 transition-colors">
                立即备份
              </button>
            </div>
            <p className="text-xs text-gray-500">最近备份: 2024-01-15 10:30</p>
          </div>
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-400 mb-2">危险操作</p>
            <button className="px-3 py-1.5 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors">
              清空所有数据
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-orange-500' : 'bg-gray-700'}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  );
}
