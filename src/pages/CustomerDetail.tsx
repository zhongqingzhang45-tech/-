import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Tag as TagIcon, MessageSquare, ShoppingCart, Edit2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import DataTable from '@/components/common/DataTable';
import Modal from '@/components/common/Modal';
import { useCustomerStore } from '@/stores';
import type { Conversation, Message, Order } from '@/types';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

const levelLabels = ['潜在', '低意向', '中意向', '高意向', '已购买'];
const levelColors = ['text-gray-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-success'];

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentCustomer, fetchCustomerById, updateCustomerTags, updateCustomerLevel } = useCustomerStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [editTagsModal, setEditTagsModal] = useState(false);
  const [editLevelModal, setEditLevelModal] = useState(false);
  const [newTags, setNewTags] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (id) {
      fetchCustomerById(Number(id));
      loadCustomerData(Number(id));
    }
  }, [id]);

  const loadCustomerData = async (customerId: number) => {
    setLoading(true);
    try {
      const [convRes, orderRes] = await Promise.all([
        api.get(`/conversations/${customerId}`),
        api.get(`/customers/${customerId}`),
      ]);

      if (convRes.data.success) {
        setConversations(convRes.data.data.list);
        setMessages(convRes.data.data.messages);
      }
      if (orderRes.data.success) {
        setOrders(orderRes.data.data.orders);
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTags = async () => {
    if (id) {
      const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);
      await updateCustomerTags(Number(id), tagsArray);
      setEditTagsModal(false);
    }
  };

  const handleSaveLevel = async (level: number) => {
    if (id) {
      await updateCustomerLevel(Number(id), level);
      setEditLevelModal(false);
    }
  };

  const columns = [
    {
      key: 'started_at',
      title: '时间',
      render: (item: Message) => (
        <span className="text-gray-400 text-xs">
          {new Date(item.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'direction',
      title: '方向',
      render: (item: Message) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${item.direction === 'in' ? 'bg-blue-500/20 text-blue-400' : 'bg-success/20 text-success'}`}>
          {item.direction === 'in' ? '客户' : item.source === 'ai' ? 'AI' : '人工'}
        </span>
      ),
    },
    {
      key: 'content',
      title: '内容',
      render: (item: Message) => (
        <span className="text-white text-sm">{item.content}</span>
      ),
    },
  ];

  const orderColumns = [
    {
      key: 'id',
      title: '订单号',
      render: (item: Order) => <span className="text-gray-400 text-sm">#{item.id}</span>,
    },
    {
      key: 'amount',
      title: '金额',
      render: (item: Order) => <span className="text-warning font-medium">¥{item.amount.toFixed(2)}</span>,
    },
    {
      key: 'status',
      title: '状态',
      render: (item: Order) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          item.status === 'paid' ? 'bg-success/20 text-success' :
          item.status === 'pending' ? 'bg-warning/20 text-warning' :
          'bg-red-500/20 text-red-400'
        }`}>
          {item.status === 'paid' ? '已付款' : item.status === 'pending' ? '待付款' : '已退款'}
        </span>
      ),
    },
    {
      key: 'payment_method',
      title: '支付方式',
      render: (item: Order) => (
        <span className="text-gray-400 text-sm">{item.payment_method === 'wechat' ? '微信' : '支付宝'}</span>
      ),
    },
    {
      key: 'paid_at',
      title: '支付时间',
      render: (item: Order) => (
        <span className="text-gray-400 text-sm">
          {item.paid_at ? new Date(item.paid_at).toLocaleString('zh-CN') : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header title="客户详情" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">返回客户列表</span>
        </button>

        {/* Customer Info Card */}
        <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img
                src={currentCustomer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentCustomer?.nickname}`}
                alt={currentCustomer?.nickname}
                className="w-16 h-16 rounded-full bg-dark-50"
              />
              <div>
                <h2 className="text-xl font-semibold text-white">{currentCustomer?.nickname}</h2>
                <p className="text-sm text-gray-400">ID: {currentCustomer?.openid}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < (currentCustomer?.level || 0) ? 'text-warning fill-warning' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                  <span className={`text-sm ${levelColors[currentCustomer?.level || 0]}`}>
                    {levelLabels[currentCustomer?.level || 0]}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNewTags(currentCustomer?.tags || '');
                  setEditTagsModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-dark-50 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <TagIcon className="w-4 h-4" />
                编辑标签
              </button>
              <button
                onClick={() => setEditLevelModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500/20 rounded-xl text-sm text-primary-300 hover:bg-primary-500/30 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                修改等级
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {currentCustomer?.tags ? (
              currentCustomer.tags.split(',').map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-primary-500/20 text-primary-300 text-sm rounded-full"
                >
                  {tag.trim()}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">暂无标签</span>
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <MessageSquare className="w-5 h-5 text-primary-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{conversations.length}</p>
              <p className="text-xs text-gray-400">对话次数</p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <ShoppingCart className="w-5 h-5 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{orders.filter(o => o.status === 'paid').length}</p>
              <p className="text-xs text-gray-400">成交订单</p>
            </div>
            <div className="p-4 bg-dark-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-warning">
                ¥{orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">累计消费</p>
            </div>
          </div>
        </div>

        {/* Conversation History */}
        <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">对话记录</h3>

          {conversations.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              暂无对话记录
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conv) => (
                <div key={conv.id} className="border border-white/5 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setSelectedConversation(selectedConversation?.id === conv.id ? null : conv)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${conv.status === 'active' ? 'bg-success' : 'bg-gray-500'}`} />
                      <span className="text-sm text-white">
                        {new Date(conv.started_at).toLocaleString('zh-CN')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {messages[conv.id]?.length || 0} 条消息
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      conv.status === 'active' ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {conv.status === 'active' ? '进行中' : '已结束'}
                    </span>
                  </button>

                  {selectedConversation?.id === conv.id && messages[conv.id] && (
                    <div className="border-t border-white/5">
                      <DataTable
                        columns={columns}
                        data={messages[conv.id]}
                        page={1}
                        limit={100}
                        total={messages[conv.id].length}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">订单记录</h3>
          <DataTable
            columns={orderColumns}
            data={orders}
            page={1}
            limit={10}
            total={orders.length}
          />
        </div>
      </div>

      {/* Edit Tags Modal */}
      <Modal isOpen={editTagsModal} onClose={() => setEditTagsModal(false)} title="编辑标签" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">输入标签，用逗号分隔</p>
          <input
            type="text"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            placeholder="例如: 高意向,已购买,VIP"
            className="w-full px-4 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setEditTagsModal(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaveTags}
              className="px-4 py-2 bg-primary-500 rounded-xl text-white text-sm hover:bg-primary-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Level Modal */}
      <Modal isOpen={editLevelModal} onClose={() => setEditLevelModal(false)} title="修改意向等级" size="sm">
        <div className="space-y-3">
          {levelLabels.map((label, i) => (
            <button
              key={i}
              onClick={() => handleSaveLevel(i)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                currentCustomer?.level === i
                  ? 'bg-primary-500/20 border border-primary-500/50'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`w-4 h-4 -ml-1 first:ml-0 ${j < i ? 'text-warning fill-warning' : 'text-gray-600'}`}
                  />
                ))}
              </div>
              <span className={`${levelColors[i]}`}>{label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
