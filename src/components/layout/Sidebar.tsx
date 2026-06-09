import { NavLink } from 'react-router-dom';
import { Users, Bot, CreditCard, Settings, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useAppStore } from '@/stores';

const navItems = [
  { path: '/', icon: Users, label: '客户列表', badge: true },
  { path: '/customers', icon: Users, label: '客户管理', hidden: true },
  { path: '/agent', icon: Bot, label: '机器人配置' },
  { path: '/payments', icon: CreditCard, label: '支付记录' },
  { path: '/settings', icon: Settings, label: '设置', hidden: true },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-dark-200 border-r border-white/5 transition-all duration-300 z-50 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm block">LifeOS</span>
              <span className="text-xs text-gray-500">成交机器人</span>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1">
        {navItems.filter((item) => !item.hidden).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 text-white border border-primary-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && (
              <>
                <span className="text-sm flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-accent-500/30 text-accent-300 text-xs rounded-full">
                    42
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status indicator */}
      {!sidebarCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-dark-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-gray-400">微信已连接</span>
              </div>
              <span className="text-xs text-success">监控中</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
                <span className="text-xs text-gray-400">AI成交机器人</span>
              </div>
              <span className="text-xs text-primary-300">运行中</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
