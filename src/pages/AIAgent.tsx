import { useEffect, useState } from 'react';
import { BookOpen, GitBranch, Settings, Plus, Search, Edit2, Trash2, Zap } from 'lucide-react';
import Header from '@/components/layout/Header';
import Modal from '@/components/common/Modal';
import { useKnowledgeStore } from '@/stores';
import type { KnowledgeItem } from '@/types';

const categories = ['全部', '价格', '购买', '优惠', '售后', '通用'];

export default function AIAgent() {
  const { items, loading, fetchKnowledge, addKnowledge, updateKnowledge, deleteKnowledge } = useKnowledgeStore();
  const [activeTab, setActiveTab] = useState<'knowledge' | 'flow' | 'rules'>('knowledge');
  const [category, setCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '通用',
    priority: 0,
  });

  useEffect(() => {
    fetchKnowledge(category === '全部' ? undefined : category);
  }, [category]);

  const filteredItems = items.filter(item =>
    item.question.includes(searchQuery) || item.answer.includes(searchQuery)
  );

  const handleSubmit = async () => {
    if (editingItem) {
      await updateKnowledge(editingItem.id, formData);
    } else {
      await addKnowledge(formData);
    }
    setModalOpen(false);
    resetForm();
  };

  const handleEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category,
      priority: item.priority,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这条知识吗？')) {
      await deleteKnowledge(id);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({ question: '', answer: '', category: '通用', priority: 0 });
  };

  return (
    <div className="min-h-screen">
      <Header title="AI智能体" subtitle="配置自动回复逻辑和知识库" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-dark-200/50 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'knowledge'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            知识库
          </button>
          <button
            onClick={() => setActiveTab('flow')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'flow'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            流程设计
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'rules'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            规则配置
          </button>
        </div>

        {/* Knowledge Base Tab */}
        {activeTab === 'knowledge' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索问题或答案..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-dark-200 border border-white/5 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      category === cat
                        ? 'bg-primary-500/20 text-primary-300'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => { resetForm(); setModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                添加知识
              </button>
            </div>

            {/* Knowledge List */}
            <div className="grid gap-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-dark-200/50 rounded-xl border border-white/5 p-4 animate-pulse">
                    <div className="h-4 bg-dark-50 rounded w-1/4 mb-3" />
                    <div className="h-3 bg-dark-50 rounded w-3/4" />
                  </div>
                ))
              ) : filteredItems.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  {searchQuery ? '未找到匹配的知识' : '暂无知识条目'}
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-dark-200/50 backdrop-blur-xl rounded-xl border border-white/5 p-5 hover:border-primary-500/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-primary-500/20 text-primary-300 text-xs rounded-full">
                            {item.category}
                          </span>
                          <span className="text-xs text-gray-500">优先级 {item.priority}</span>
                        </div>
                        <h4 className="text-white font-medium mb-1">{item.question}</h4>
                        <p className="text-sm text-gray-400">{item.answer}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Flow Design Tab */}
        {activeTab === 'flow' && (
          <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">流程画布</h3>
                <p className="text-sm text-gray-400">拖拽节点设计自动回复流程</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" />
                添加节点
              </button>
            </div>

            {/* Flow Canvas Placeholder */}
            <div className="h-96 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <GitBranch className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">流程设计器</p>
                <p className="text-xs text-gray-600 mt-1">可视化拖拽功能开发中</p>
              </div>
            </div>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Keyword Rules */}
            <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">关键词触发</h3>
                <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-dark-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-primary-400" />
                    <span className="text-white text-sm">价格 / 多少钱 / 报价</span>
                  </div>
                  <span className="text-xs text-gray-500">→ 发送价格信息</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-success" />
                    <span className="text-white text-sm">购买 / 下单 / 付款</span>
                  </div>
                  <span className="text-xs text-gray-500">→ 发送购买链接</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-warning" />
                    <span className="text-white text-sm">优惠 / 打折 / 便宜</span>
                  </div>
                  <span className="text-xs text-gray-500">→ 发送优惠信息</span>
                </div>
              </div>
            </div>

            {/* Sensitive Words */}
            <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">敏感词过滤</h3>
                <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <span className="text-red-400 text-sm">政治敏感词</span>
                </div>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <span className="text-red-400 text-sm">广告推销词</span>
                </div>
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl">
                  <span className="text-warning text-sm">竞品关键词</span>
                </div>
              </div>
            </div>

            {/* Transfer Rules */}
            <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">转人工规则</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-dark-50 rounded-xl">
                  <span className="text-gray-300 text-sm">连续3次未识别意图</span>
                  <span className="text-xs px-2 py-0.5 bg-primary-500/20 text-primary-300 rounded-full">自动转人工</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-50 rounded-xl">
                  <span className="text-gray-300 text-sm">客户发送「人工」</span>
                  <span className="text-xs px-2 py-0.5 bg-primary-500/20 text-primary-300 rounded-full">立即转人工</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-50 rounded-xl">
                  <span className="text-gray-300 text-sm">情绪检测到负面</span>
                  <span className="text-xs px-2 py-0.5 bg-warning/20 text-warning rounded-full">预警+转人工</span>
                </div>
              </div>
            </div>

            {/* Auto Response Settings */}
            <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">自动回复设置</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">欢迎语</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-dark-50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">关键词自动回复</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-dark-50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">未识别时发送FAQ</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-dark-50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Knowledge Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingItem ? '编辑知识' : '添加知识'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">问题/关键词</label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="输入客户可能问的问题"
              className="w-full px-4 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">回答内容</label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              placeholder="输入自动回复的内容"
              rows={4}
              className="w-full px-4 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">分类</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
              >
                {categories.filter(c => c !== '全部').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">优先级 (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => { setModalOpen(false); resetForm(); }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.question || !formData.answer}
              className="px-6 py-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {editingItem ? '保存修改' : '添加'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
