import { useEffect, useState } from 'react';
import { FolderOpen, FileText, Image, Video, Plus, Edit2, Trash2, Copy, Check } from 'lucide-react';
import Header from '@/components/layout/Header';
import Modal from '@/components/common/Modal';
import { useTemplateStore } from '@/stores';

const categories = ['全部', '开场', '产品', '跟进', '催单', '售后'];

export default function Materials() {
  const { items, loading, fetchTemplates, addTemplate, updateTemplate, deleteTemplate } = useTemplateStore();
  const [category, setCategory] = useState('全部');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: '通用',
  });

  useEffect(() => {
    fetchTemplates(category === '全部' ? undefined : category);
  }, [category]);

  const handleSubmit = async () => {
    if (editingItem) {
      await updateTemplate(editingItem.id, formData);
    } else {
      await addTemplate(formData);
    }
    setModalOpen(false);
    resetForm();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      content: item.content,
      category: item.category,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个话术模板吗？')) {
      await deleteTemplate(id);
    }
  };

  const handleCopy = (item: any) => {
    navigator.clipboard.writeText(item.content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({ name: '', content: '', category: '开场' });
  };

  return (
    <div className="min-h-screen">
      <Header title="素材中心" subtitle="管理话术模板和产品素材" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 p-1 bg-dark-200/50 rounded-xl w-fit">
          <button
            onClick={() => setCategory('全部')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              category === '全部'
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            全部
          </button>
          {categories.filter(c => c !== '全部').map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-200/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <FileText className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{items.length}</p>
                <p className="text-xs text-gray-400">话术模板</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-200/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-500/20 rounded-lg">
                <Image className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">12</p>
                <p className="text-xs text-gray-400">图片素材</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-200/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <Video className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">5</p>
                <p className="text-xs text-gray-400">视频素材</p>
              </div>
            </div>
          </div>
          <div className="bg-dark-200/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/20 rounded-lg">
                <FolderOpen className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">3</p>
                <p className="text-xs text-gray-400">产品链接</p>
              </div>
            </div>
          </div>
        </div>

        {/* Templates Section */}
        <div className="bg-dark-200/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">话术模板</h3>
              <p className="text-sm text-gray-400">管理和编辑自动回复话术</p>
            </div>
            <button
              onClick={() => { resetForm(); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              添加模板
            </button>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-dark-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              暂无话术模板
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-dark-50 rounded-xl p-4 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-medium">{item.name}</h4>
                        <span className="px-2 py-0.5 bg-primary-500/20 text-primary-300 text-xs rounded-full">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2">{item.content}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(item)}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                        title="复制"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingItem ? '编辑模板' : '添加模板'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">模板名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如: 欢迎语"
              className="w-full px-4 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">话术内容</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="输入话术内容，支持变量替换 {name} {product}"
              rows={6}
              className="w-full px-4 py-2.5 bg-dark-50 border border-white/5 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 resize-none"
            />
          </div>

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

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => { setModalOpen(false); resetForm(); }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.content}
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
