import { useState } from 'react';
import { Monitor, Link2, CreditCard, Bell, Shield, Database, Save } from 'lucide-react';
import Header from '@/components/layout/Header';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('wechat');

  return (
    <div className="min-h-screen">
      <Header title="系统设置" subtitle="配置微信接入和支付设置" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-dark-200/50 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('wechat')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'wechat'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            微信接入
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'payment'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            支付配置
          </button>
          <button
            onClick={() => setActiveTab('notification')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'notification'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            通知设置
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'security'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            安全设置
          </button>
        </div>

        {/* WeChat Settings */}
        {activeTab === 'wechat' && (
          <div className="space-y-6">
            <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">微信PC版接入</h3>
              <p className="text-sm text-gray-400 mb-6">
                通过Windows Hook技术在本地捕获微信消息，需要在运行微信PC版的电脑上安装消息捕获程序。
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                    <span className="text-white">Hook服务状态</span>
                  </div>
                  <span className="text-success text-sm">已连接</span>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">服务器地址</label>
                  <input
                    type="text"
                    defaultValue="ws://localhost:8080"
                    className="w-full px-4 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">API密钥</label>
                  <input
                    type="password"
                    defaultValue="sk-xxxxx-xxxxx"
                    className="w-full px-4 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Link2 className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-white text-sm">下载Hook程序</p>
                      <p className="text-xs text-gray-400">Windows x64 版本 v1.2.3</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-primary-500 rounded-lg text-white text-sm hover:bg-primary-600 transition-colors">
                    下载
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">消息推送设置</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">自动推送新消息</p>
                    <p className="text-xs text-gray-400">有新客户消息时自动推送到管理端</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-dark-50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">对话结束时通知</p>
                    <p className="text-xs text-gray-400">客户对话结束或转人工时发送通知</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-dark-50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Settings */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">收款码配置</h3>
              <p className="text-sm text-gray-400 mb-6">
                配置支付宝和微信收款码，客户可直接扫码付款。
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-success/20 rounded-lg">
                      <span className="text-success font-bold text-sm">支</span>
                    </div>
                    <span className="text-white font-medium">支付宝</span>
                  </div>
                  <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors cursor-pointer">
                    <div className="w-16 h-16 bg-dark-50 rounded-xl mx-auto mb-3 flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-400">点击上传收款码图片</p>
                    <p className="text-xs text-gray-500 mt-1">支持 JPG、PNG，建议尺寸 200x200</p>
                  </div>
                </div>

                <div className="p-4 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-success/20 rounded-lg">
                      <span className="text-success font-bold text-sm">微</span>
                    </div>
                    <span className="text-white font-medium">微信支付</span>
                  </div>
                  <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors cursor-pointer">
                    <div className="w-16 h-16 bg-dark-50 rounded-xl mx-auto mb-3 flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-400">点击上传收款码图片</p>
                    <p className="text-xs text-gray-500 mt-1">支持 JPG、PNG，建议尺寸 200x200</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">支付链接</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">产品购买链接</label>
                  <input
                    type="text"
                    placeholder="https://your-store.com/buy"
                    className="w-full px-4 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">备用链接</label>
                  <input
                    type="text"
                    placeholder="https://backup-store.com/buy"
                    className="w-full px-4 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notification' && (
          <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">通知偏好</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div>
                  <p className="text-white text-sm">新客户咨询</p>
                  <p className="text-xs text-gray-400">有新客户添加并发起咨询时通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-dark-50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div>
                  <p className="text-white text-sm">订单成功</p>
                  <p className="text-xs text-gray-400">有客户完成付款时通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-dark-50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div>
                  <p className="text-white text-sm">需要人工介入</p>
                  <p className="text-xs text-gray-400">AI无法处理需要人工回复时通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-dark-50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div>
                  <p className="text-white text-sm">每日数据报告</p>
                  <p className="text-xs text-gray-400">每日发送数据汇总到邮箱</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-dark-50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">账号安全</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">当前密码</label>
                  <input
                    type="password"
                    placeholder="输入当前密码"
                    className="w-full px-4 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">新密码</label>
                  <input
                    type="password"
                    placeholder="输入新密码"
                    className="w-full px-4 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">确认新密码</label>
                  <input
                    type="password"
                    placeholder="再次输入新密码"
                    className="w-full px-4 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">数据安全</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">消息加密存储</p>
                    <p className="text-xs text-gray-400">所有聊天记录加密存储</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-dark-50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">操作日志记录</p>
                    <p className="text-xs text-gray-400">记录所有管理员操作</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-dark-50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">数据库</h3>
              <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-primary-400" />
                  <div>
                    <p className="text-white text-sm">数据库备份</p>
                    <p className="text-xs text-gray-400">最近备份: 2024-01-15 10:30</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-lg text-sm hover:bg-primary-500/30 transition-colors">
                  立即备份
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity">
            <Save className="w-4 h-4" />
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}
