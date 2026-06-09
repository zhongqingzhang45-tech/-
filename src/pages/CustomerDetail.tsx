import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Tag as TagIcon, CreditCard, ChevronDown, ChevronUp, Zap, Clock, MessageSquare, RotateCcw } from 'lucide-react';
import Header from '@/components/layout/Header';
import { STATUS_LEVELS, getLevelConfig } from '@/utils/levels';
import type { Customer, Message, Order, CustomerLifecycle } from '@/types';

interface MockDetailData {
  customer: Customer;
  messages: Message[];
  orders: Order[];
  lifecycle: CustomerLifecycle[];
}

const generateMockDetail = (id: number): MockDetailData => {
  const customer: Customer = {
    id,
    openid: `wx_${10000 + id}`,
    nickname: ['张伟', '李娜', '王强', '刘芳', '陈明', '杨雪', '赵磊'][id % 7],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    level: Math.max(1, Math.min(id, 8)),
    tags: '咨询项目,询价',
    last_message: '这个项目启动需要多少钱？',
    last_message_at: new Date(Date.now() - 3600000 * id).toISOString(),
    total_amount: id >= 7 ? 1299 : 0,
    created_at: new Date(Date.now() - 86400000 * id).toISOString(),
    last_status_at: new Date(Date.now() - 7200000 * id).toISOString(),
  };

  const messages: Message[] = [
    { id: 1, conversation_id: 1, content: '你好', direction: 'in', source: 'customer', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 2, conversation_id: 1, content: '您好！我是AI成交助手，有什么可以帮您？👋', direction: 'out', source: 'ai', created_at: new Date(Date.now() - 86400000 * 2 + 30000).toISOString() },
    { id: 3, conversation_id: 1, content: '看了你们的创业项目，感觉不错', direction: 'in', source: 'customer', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 4, conversation_id: 1, content: '谢谢关注！我们目前有3个主推项目，平均回本周期3-6个月，您对哪个方向感兴趣？', direction: 'out', source: 'ai', created_at: new Date(Date.now() - 86400000 + 30000).toISOString() },
    { id: 5, conversation_id: 1, content: '这个项目启动需要多少钱？', direction: 'in', source: 'customer', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 6, conversation_id: 1, content: '我们有不同档位方案：基础版299元/专业版599元/企业版1299元。大部分客户选择专业版，包含完整项目资料+3个月陪跑。目前有8折优惠，今天下单送项目诊断报告一份', direction: 'out', source: 'ai', created_at: new Date(Date.now() - 3500000).toISOString() },
  ];

  const orders: Order[] = id >= 7 ? [
    { id: 1001, customer_id: id, customer_name: customer.nickname, amount: 1299, status: 'paid', payment_method: 'wechat', product_name: '专业版 + 陪跑', paid_at: new Date(Date.now() - 3600000).toISOString() },
  ] : [];

  const lifecycle: CustomerLifecycle[] = [
    { id: 1, customer_id: id, from_level: 0, to_level: 1, reason: '新添加好友', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 2, customer_id: id, from_level: 1, to_level: 2, reason: '查看了朋友圈内容', created_at: new Date(Date.now() - 86400000 * 1.5).toISOString() },
    { id: 3, customer_id: id, from_level: 2, to_level: 4, reason: '主动询问价格', created_at: new Date(Date.now() - 3600000).toISOString() },
  ];

  return { customer, messages, orders, lifecycle };
};

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const QUICK_REPLIES = [
  { label: '发产品介绍', content: '我们有3个主推方案：\n\n1️⃣ 基础版 ¥299 - 项目资料\n2️⃣ 专业版 ¥599 - 资料+陪跑(最受欢迎)\n3️⃣ 企业版 ¥1299 - 全套+诊断\n\n目前限时8折，需要详细介绍吗？' },
  { label: '发起购买', content: '好的！专业版 ¥599，今天8折后 ¥479\n\n购买链接（或收款码）👉\n\n付款后30分钟内发送全部资料' },
  { label: '处理犹豫', content: '理解您的顾虑。购买后：\n\n✅ 24小时无理由退款\n✅ 资料永久有效\n✅ 加入内部陪跑群\n\n目前已有200+人在跑，大部分6个月内回本' },
  { label: '发送收款', content: '付款请扫下方二维码\n\n支付后截图发我，立即安排交付' },
];

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MockDetailData | null>(null);
  const [inputText, setInputText] = useState('');
  const [levelPicker, setLevelPicker] = useState(false);
  const [tagModal, setTagModal] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(generateMockDetail(Number(id)));
      setLoading(false);
    }, 400);
  }, [id]);

  const handleSendMessage = (content: string) => {
    if (!content.trim() || !data) return;
    const newMsg: Message = {
      id: Date.now(),
      conversation_id: 1,
      content: content.trim(),
      direction: 'out',
      source: 'manual',
      created_at: new Date().toISOString(),
    };
    setData({ ...data, messages: [...data.messages, newMsg] });
    setInputText('');
  };

  const handleChangeLevel = (newLevel: number) => {
    if (!data) return;
    const newLifecycle: CustomerLifecycle = {
      id: Date.now(),
      customer_id: data.customer.id,
      from_level: data.customer.level,
      to_level: newLevel,
      reason: '手动调整',
      created_at: new Date().toISOString(),
    };
    setData({
      ...data,
      customer: { ...data.customer, level: newLevel, last_status_at: new Date().toISOString() },
      lifecycle: [...data.lifecycle, newLifecycle],
    });
    setLevelPicker(false);
  };

  const handleAddTag = () => {
    if (!newTag.trim() || !data) return;
    const currentTags = data.customer.tags.split(',').map(t => t.trim()).filter(Boolean);
    currentTags.push(newTag.trim());
    setData({ ...data, customer: { ...data.customer, tags: currentTags.join(',') } });
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!data) return;
    const currentTags = data.customer.tags.split(',').map(t => t.trim()).filter(Boolean).filter(t => t !== tagToRemove);
    setData({ ...data, customer: { ...data.customer, tags: currentTags.join(',') } });
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-dark-300">
        <Header title="客户详情" />
        <div className="p-6 text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  const { customer, messages, orders, lifecycle } = data;
  const levelConf = getLevelConfig(customer.level);
  const tags = customer.tags.split(',').map(t => t.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-dark-300">
      <Header title={customer.nickname} subtitle={levelConf.label} />

      <div className="p-6 space-y-5 animate-fade-in">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回客户列表
        </button>

        {/* 客户状态卡片 */}
        <div className="bg-dark-200/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-5 pb-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <img src={customer.avatar} alt={customer.nickname} className="w-14 h-14 rounded-full bg-dark-50" />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-dark-200 ${levelConf.dot}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white text-base">{customer.nickname}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${levelConf.bg} ${levelConf.color}`}>
                    {levelConf.label}
                  </span>
                  {customer.total_amount && customer.total_amount > 0 ? (
                    <span className="text-xs px-2 py-0.5 bg-success/10 text-success rounded">
                      消费 ¥{customer.total_amount.toFixed(0)}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-gray-500">{customer.openid} · 添加于 {new Date(customer.created_at).toLocaleDateString('zh-CN')}</p>

                {/* 标签 */}
                <div className="flex items-center flex-wrap gap-1.5 mt-3">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => handleRemoveTag(tag)}
                      className="text-xs px-2 py-0.5 bg-dark-50 text-gray-300 rounded-full cursor-pointer hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      {tag} ×
                    </span>
                  ))}
                  <button
                    onClick={() => setTagModal(true)}
                    className="text-xs px-2 py-0.5 border border-dashed border-white/10 text-gray-500 rounded-full hover:border-white/20 hover:text-gray-300 transition-colors"
                  >
                    + 标签
                  </button>
                </div>
              </div>

              {/* 状态调整 */}
              <div className="relative">
                <button
                  onClick={() => setLevelPicker(!levelPicker)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${levelConf.bg} ${levelConf.border}`}
                >
                  <span className={`text-sm ${levelConf.color}`}>{levelConf.label}</span>
                  {levelPicker ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                </button>
                {levelPicker && (
                  <div className="absolute right-0 top-12 z-10 w-44 bg-dark-200 border border-white/10 rounded-xl shadow-2xl py-1 animate-fade-in">
                    {STATUS_LEVELS.map((l) => (
                      <button
                        key={l.level}
                        onClick={() => handleChangeLevel(l.level)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors ${
                          customer.level === l.level ? 'bg-white/5' : ''
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${l.dot}`} />
                        <span className={`text-sm ${l.color}`}>{l.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 状态流转记录 */}
          {lifecycle.length > 0 && (
            <div className="px-5 pb-4 border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2.5">
                <RotateCcw className="w-3 h-3" />
                状态流转
              </div>
              <div className="relative pl-4 space-y-2.5">
                {lifecycle.slice().reverse().slice(0, 5).map((l) => {
                  const toLevel = getLevelConfig(l.to_level);
                  return (
                    <div key={l.id} className="flex items-start gap-2.5">
                      <div className="relative flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full mt-1 ${toLevel.dot}`} />
                        <div className="absolute left-1/2 top-3 w-px h-full bg-white/5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs">
                          <span className={`${toLevel.color}`}>L{l.from_level || '0'} → {toLevel.label}</span>
                          <span className="text-gray-500 ml-2">{l.reason}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">{formatTime(l.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 对话消息 */}
        <div className="bg-dark-200/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <MessageSquare className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-white">对话消息</h3>
            <span className="text-xs text-gray-500">{messages.length} 条</span>
            <span className="ml-auto text-xs px-1.5 py-0.5 bg-primary-500/10 text-primary-300 rounded">AI自动回复</span>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isOut = msg.direction === 'out';
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isOut ? 'justify-end' : 'justify-start'}`}>
                  {!isOut && (
                    <img src={customer.avatar} alt="" className="w-8 h-8 rounded-full bg-dark-50 flex-shrink-0" />
                  )}
                  <div className={`max-w-[75%] ${isOut ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                        isOut
                          ? msg.source === 'ai'
                            ? 'bg-gradient-to-br from-primary-500/20 to-accent-500/20 text-white border border-primary-500/20'
                            : 'bg-primary-500 text-white'
                          : 'bg-dark-50 text-gray-200'
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 mt-1 text-xs text-gray-500 ${isOut ? 'justify-end' : ''}`}>
                      <span>{formatTime(msg.created_at)}</span>
                      {isOut && msg.source === 'ai' && (
                        <span className="flex items-center gap-0.5 text-primary-400">
                          <Zap className="w-2.5 h-2.5" /> AI
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 快捷回复 */}
          <div className="px-4 pt-2 pb-1 flex items-center flex-wrap gap-1.5 border-t border-white/5">
            <span className="text-xs text-gray-500 mr-1">快捷:</span>
            {QUICK_REPLIES.map((qr, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qr.content)}
                className="text-xs px-2 py-1 bg-dark-50 text-gray-400 rounded-full hover:bg-primary-500/10 hover:text-primary-300 transition-colors"
              >
                {qr.label}
              </button>
            ))}
          </div>

          {/* 输入框 */}
          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                placeholder="输入消息，回车发送(手动介入)..."
                className="flex-1 px-3.5 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
              />
              <button
                onClick={() => handleSendMessage(inputText)}
                className="p-2.5 bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30"
                disabled={!inputText.trim()}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 订单 */}
        {orders.length > 0 && (
          <div className="bg-dark-200/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <CreditCard className="w-4 h-4 text-success" />
              <h3 className="text-sm font-semibold text-white">订单记录</h3>
              <span className="text-xs text-gray-500">{orders.length} 笔</span>
            </div>
            <div className="p-4 space-y-2">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-dark-50 rounded-xl">
                  <div>
                    <p className="text-sm text-white font-medium">{order.product_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.payment_method === 'wechat' ? '微信' : '支付宝'} · {order.paid_at ? formatTime(order.paid_at) : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-warning font-semibold">¥{order.amount.toFixed(0)}</p>
                    <span className="text-xs text-success">已付款</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 成交建议 */}
        <div className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 border border-primary-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Zap className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-white">AI 成交建议</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <span className={`text-xs px-1.5 py-0.5 rounded ${levelConf.bg} ${levelConf.color} flex-shrink-0 mt-0.5`}>
                当前: {levelConf.label}
              </span>
              <span className="text-gray-300">
                {customer.level === 1 && '客户刚添加，建议发送欢迎语+价值内容，不硬推'}
                {customer.level === 2 && '有初步兴趣，建议发送案例+案例数据，建立信任'}
                {customer.level === 3 && '主动咨询说明有需求，建议重点跟进，发送产品介绍'}
                {customer.level === 4 && '到了关键点！建议强调限时优惠，促单'}
                {customer.level === 5 && '客户犹豫中，建议发送：\n1. 更多真实案例\n2. 无理由退款承诺\n3. 限时优惠'}
                {customer.level === 6 && '临门一脚！建议立即发送收款码'}
                {customer.level >= 7 && '已成交！建议进入交付+转介绍培养'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 标签弹窗 */}
      {tagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setTagModal(false)}>
          <div
            className="bg-dark-200 border border-white/10 rounded-2xl p-5 w-80 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-white mb-3">添加标签</h3>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="例如: 已付款,犹豫中"
                className="flex-1 px-3 py-2 bg-dark-50 border border-white/5 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600"
              >
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className="text-xs text-gray-500 mr-1">常用:</span>
              {['已付款', '咨询项目', '询价', '犹豫中', '预算3K', '预算5K', '创业小白'].map((t) => (
                <button
                  key={t}
                  onClick={() => setNewTag(t)}
                  className="text-xs px-2 py-0.5 bg-dark-50 text-gray-400 rounded-full hover:bg-primary-500/20 hover:text-primary-300 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => setTagModal(false)}
              className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
