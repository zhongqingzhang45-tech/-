import { useState } from 'react';
import { Bot, MessageSquarePlus, Power, Zap, AlertTriangle, Clock, Filter, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { STATUS_LEVELS, getLevelConfig } from '@/utils/levels';
import type { KnowledgeItem } from '@/types';

// 初始规则库
const INITIAL_RULES: KnowledgeItem[] = [
  { id: 1, question: '你好', answer: '您好！我是AI成交助手，很高兴认识您 👋\n\n我这里主要分享一些轻资产创业项目，适合上班族、宝妈、大学生做副业。目前3个主推项目，大部分人6个月内回本，有兴趣了解一下吗？', keywords: '你好,您好,哈喽,hi,在吗', priority: 100, level: 1, created_at: new Date().toISOString() },
  { id: 2, question: '价格/多少钱', answer: '我们有3个主推方案：\n\n1️⃣ 基础版 ¥299 — 项目资料包（含执行步骤）\n2️⃣ 专业版 ¥599 — 资料+3个月陪跑（80%人选）\n3️⃣ 企业版 ¥1299 — 全套+诊断报告\n\n🔥 今日限时8折，需要详细介绍吗？', keywords: '价格,多少钱,费用,报价,怎么卖', priority: 95, level: 4, created_at: new Date().toISOString() },
  { id: 3, question: '有优惠吗', answer: '有的！🎁\n\n1. 今日限时8折，立减120\n2. 送项目诊断报告1次（价值¥199）\n3. 3个月内部陪跑群\n\n优惠今晚12点截止，要抓住机会哦～', keywords: '优惠,打折,便宜,降价,便宜点', priority: 90, level: 4, created_at: new Date().toISOString() },
  { id: 4, question: '靠谱吗/是真的吗', answer: '理解您的顾虑。给您看几个数据 👇\n\n✅ 目前200+人在跑\n✅ 大部分3-6个月回本\n✅ 24小时无理由退款\n✅ 资料永久有效\n\n要不要看看真实案例和截图？', keywords: '靠谱,真的,真实,可信,骗人,骗钱', priority: 85, level: 5, created_at: new Date().toISOString() },
  { id: 5, question: '考虑一下', answer: '好的，理解您需要考虑 👌\n\n给您一个建议：今晚8点前下单额外赠送一次项目诊断（价值¥199），明早发您一份详细资料包，先看看不买也没问题～', keywords: '考虑,想想,再看看,犹豫,纠结', priority: 80, level: 5, created_at: new Date().toISOString() },
  { id: 6, question: '怎么付款', answer: '好的！专业版 ¥599，今日8折 ¥479 ✨\n\n👇 扫码支付（或发红包也可以）\n\n📸 支付后截图发我，立即安排交付！', keywords: '付款,支付,怎么买,怎么下单,买一个', priority: 95, level: 6, created_at: new Date().toISOString() },
  { id: 7, question: '已付款', answer: '🎉 收到！感谢信任！\n\n马上为您安排：\n1. 全部资料（30分钟内）\n2. 拉您进入陪跑群\n3. 项目诊断预约\n\n有任何问题随时找我，24小时在线～', keywords: '付款了,已付,已转,转了,付了', priority: 100, level: 7, created_at: new Date().toISOString() },
  { id: 8, question: '朋友推荐', answer: '欢迎！😊\n\n感谢您朋友的信任，也感谢您过来。作为老客推荐福利，可以在8折基础上再送您一次项目诊断（价值¥199）。', keywords: '朋友推荐,介绍,别人推荐,朋友说', priority: 90, level: 8, created_at: new Date().toISOString() },
];

const AUTO_FOLLOW_UPS = [
  { trigger: 'L1', content: '您好！朋友圈有更新一些项目案例，感兴趣可以看看～', enabled: true, hours: 24 },
  { trigger: 'L3', content: '刚刚有个客户问类似问题，要不要也给您看下案例？', enabled: true, hours: 6 },
  { trigger: 'L5', content: '有位朋友犹豫了3天，今天终于决定试试，您怎么看？\n（附：今日8折还剩最后8小时）', enabled: true, hours: 12 },
  { trigger: 'L6', content: '提醒：8折优惠今晚12点截止，明天恢复原价哦～', enabled: true, hours: 24 },
];

export default function AgentConfig() {
  const [activeTab, setActiveTab] = useState<'rules' | 'auto' | 'welcome'>('rules');
  const [rules, setRules] = useState<KnowledgeItem[]>(INITIAL_RULES);
  const [searchText, setSearchText] = useState('');
  const [editing, setEditing] = useState<KnowledgeItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [autoFollow, setAutoFollow] = useState(AUTO_FOLLOW_UPS.map((r) => ({ ...r })));
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);

  // 表单
  const [formData, setFormData] = useState<Omit<KnowledgeItem, 'id' | 'created_at'>>({
    question: '', answer: '', keywords: '', priority: 50, level: 1,
  });

  const filteredRules = rules.filter((r) =>
    r.question.includes(searchText) ||
    r.keywords.includes(searchText) ||
    r.answer.includes(searchText)
  );

  const handleSaveRule = () => {
    if (!formData.question || !formData.answer) return;
    if (editing) {
      setRules(rules.map((r) => (r.id === editing.id ? { ...editing, ...formData } : r)));
    } else {
      setRules([...rules, { ...formData, id: Date.now(), created_at: new Date().toISOString() }]);
    }
    setEditing(null);
    setIsNew(false);
    setFormData({ question: '', answer: '', keywords: '', priority: 50, level: 1 });
  };

  const handleDelete = (id: number) => {
    if (confirm('确定删除？')) {
      setRules(rules.filter((r) => r.id !== id));
    }
  };

  const handleToggleAutoFollow = (idx: number) => {
    setAutoFollow(autoFollow.map((a, i) => (i === idx ? { ...a, enabled: !a.enabled } : a)));
  };

  return (
    <div className="min-h-screen bg-dark-300">
      <Header title="机器人配置" subtitle={`${rules.length} 条规则 · ${autoReplyEnabled ? '运行中' : '已停止'}`} />

      <div className="p-6 space-y-5 animate-fade-in">
        {/* 主开关 */}
        <div className="bg-dark-200/50 backdrop-blur-xl border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${autoReplyEnabled ? 'bg-gradient-to-br from-primary-500 to-accent-500' : 'bg-dark-50'}`}>
              <Bot className={`w-5 h-5 ${autoReplyEnabled ? 'text-white' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">自动回复机器人</p>
              <p className="text-xs text-gray-500">监听微信消息，智能识别+自动回复+自动跟进</p>
            </div>
          </div>
          <button
            onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              autoReplyEnabled ? 'bg-gradient-to-r from-primary-500 to-accent-500' : 'bg-dark-50'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                autoReplyEnabled ? 'translate-x-7' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-dark-200/50 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'rules'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquarePlus className="w-4 h-4" />
            关键词规则 ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('auto')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'auto'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            自动跟进 ({autoFollow.filter((a) => a.enabled).length})
          </button>
          <button
            onClick={() => setActiveTab('welcome')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'welcome'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            欢迎语
          </button>
        </div>

        {/* 规则列表 */}
        {activeTab === 'rules' && (
          <>
            {/* 搜索 + 添加 */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="搜索关键词/问题"
                  className="w-full pl-9 pr-4 py-2.5 bg-dark-200 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                />
              </div>
              <button
                onClick={() => {
                  setIsNew(true);
                  setEditing(null);
                  setFormData({ question: '', answer: '', keywords: '', priority: 50, level: 1 });
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                添加规则
              </button>
            </div>

            {/* 规则卡片列表 */}
            <div className="space-y-3">
              {filteredRules.map((rule) => {
                const levelConf = getLevelConfig(rule.level);
                return (
                  <div
                    key={rule.id}
                    className="bg-dark-200/50 backdrop-blur-xl border border-white/5 rounded-xl p-4 hover:border-primary-500/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{rule.question}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${levelConf.bg} ${levelConf.color}`}>
                          触发→{levelConf.label}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-warning/10 text-warning rounded">
                          优先级 {rule.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditing(rule); setIsNew(false); setFormData({ question: rule.question, answer: rule.answer, keywords: rule.keywords, priority: rule.priority, level: rule.level }); }}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-1.5">
                      关键词: {rule.keywords.split(',').map((k, i) => (
                        <span key={i} className="text-primary-300 mr-1.5">{k.trim()}</span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{rule.answer}</div>
                  </div>
                );
              })}
              {filteredRules.length === 0 && (
                <div className="py-12 text-center text-gray-500 text-sm">没有匹配的规则</div>
              )}
            </div>
          </>
        )}

        {/* 自动跟进 */}
        {activeTab === 'auto' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-4 bg-warning/10 border border-warning/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-300">
                <p className="font-medium text-warning mb-1">自动跟进规则</p>
                <p>客户进入指定状态后，按时间自动发送跟进消息。不自动回复则客户容易流失。</p>
              </div>
            </div>

            {autoFollow.map((a, idx) => {
              const levelConf = STATUS_LEVELS.find((l) => l.level === parseInt(a.trigger.replace('L', ''))) || STATUS_LEVELS[0];
              return (
                <div key={idx} className="bg-dark-200/50 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${levelConf.bg} ${levelConf.color}`}>
                        {a.trigger}
                      </span>
                      <span className="text-xs text-gray-400">客户进入该状态后 {a.hours} 小时自动发送</span>
                    </div>
                    <button
                      onClick={() => handleToggleAutoFollow(idx)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${a.enabled ? 'bg-gradient-to-r from-primary-500 to-accent-500' : 'bg-dark-50'}`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${a.enabled ? 'translate-x-5.5' : 'translate-x-0.5'}`}
                        style={{ transform: a.enabled ? 'translateX(22px)' : 'translateX(2px)' }}
                      />
                    </button>
                  </div>
                  <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed bg-dark-50 rounded-lg p-3 mt-2">
                    {a.content}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 欢迎语 */}
        {activeTab === 'welcome' && (
          <div className="space-y-3">
            <div className="bg-dark-200/50 backdrop-blur-xl border border-white/5 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-primary-400" />
                <span className="text-sm font-semibold text-white">新客户自动欢迎语</span>
              </div>
              <textarea
                defaultValue="您好！很高兴认识您 👋\n\n我是做轻资产创业项目分享的，目前有3个主推项目：\n\n1. 基础版 ¥299 — 项目资料\n2. 专业版 ¥599 — 资料+陪跑（80%人选）\n3. 企业版 ¥1299 — 全套+诊断\n\n🔥 今日限时8折！\n\n随便问什么都可以，我是AI，24小时在线～"
                rows={10}
                className="w-full px-4 py-3 bg-dark-50 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">新添加的好友自动收到此消息</span>
                <button className="px-4 py-2 bg-gradient-to-br from-primary-500 to-accent-500 text-white text-sm rounded-lg hover:opacity-90 transition-opacity">
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑/新增弹窗 */}
        {(editing !== null || isNew) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setEditing(null); setIsNew(false); }}>
            <div
              className="bg-dark-200 border border-white/10 rounded-2xl p-5 w-full max-w-xl animate-fade-in max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-white mb-4">{isNew ? '添加新规则' : '编辑规则'}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">问题/描述</label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="例如：价格询问"
                    className="w-full px-3.5 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">触发关键词（用英文逗号分隔）</label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="价格,多少钱,费用"
                    className="w-full px-3.5 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">回复内容</label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="您的自动回复..."
                    rows={6}
                    className="w-full px-3.5 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500/50 resize-none leading-relaxed"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">触发客户状态</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-sm text-white focus:outline-none"
                    >
                      {STATUS_LEVELS.map((l) => (
                        <option key={l.level} value={l.level}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">优先级 (0-100)</label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => { setEditing(null); setIsNew(false); }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveRule}
                  disabled={!formData.question || !formData.answer}
                  className="px-5 py-2 bg-gradient-to-br from-primary-500 to-accent-500 text-white text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
