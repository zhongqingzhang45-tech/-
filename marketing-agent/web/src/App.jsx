import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Flame, Package, FileText, BarChart3, Settings, Zap } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Contents from './pages/Contents';
import Publish from './pages/Publish';
import SettingsPage from './pages/Settings';

function Sidebar() {
  const navs = [
    { path: '/', icon: Flame, label: '爆品池' },
    { path: '/products', icon: Package, label: '商品管理' },
    { path: '/contents', icon: FileText, label: '内容库' },
    { path: '/publish', icon: Zap, label: '发布记录' },
    { path: '/settings', icon: Settings, label: '设置' },
  ];

  return (
    <aside className="w-56 min-h-screen bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-700">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mr-3">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-sm block">LifeOS</span>
          <span className="text-xs text-gray-400">V3.0</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navs.map((nav) => (
          <NavLink
            key={nav.path}
            to={nav.path}
            end={nav.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`
            }
          >
            <nav.icon className="w-4 h-4" />
            {nav.label}
          </NavLink>
        ))}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-gray-700">
        <div className="bg-gray-900 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-400">爆品雷达</span>
            </div>
            <span className="text-xs text-green-400">运行中</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs text-gray-400">内容工厂</span>
            </div>
            <span className="text-xs text-orange-400">待命中</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/contents" element={<Contents />} />
            <Route path="/publish" element={<Publish />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
