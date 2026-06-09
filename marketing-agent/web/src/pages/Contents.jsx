import { useEffect, useState } from 'react';
import { Plus, RefreshCw, FileText, Send, Copy, Check, Edit2, Eye } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export default function Contents() {
  const [contents, setContents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contents?limit=50');
      if (res.data.success) {
        setContents(res.data.data.list);
        setStats(res.data.data.stats);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const generateContent = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/contents/generate', {});
      if (res.data.success) {
        await loadContents();
      } else {
        alert(res.data.error || '生成失败');
      }
    } catch (e) {
      console.error(e);
      alert('生成失败');
    }
    setGenerating(false);
  };

  const copyContent = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">内容库</h1>
          <p className="text-sm text-gray-400 mt-1">
            共 {stats.total || 0} 条内容 · 已发布 {stats.published || 0} 条
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadContents}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-400 text-sm rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            刷新
          </button>
          <button
            onClick={generateContent}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            {generating ? '生成中...' : 'AI生成内容'}
          </button>
        </div>
      </div>

      {/* Contents */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-gray-700 rounded w-1/3 mb-3"></div>
              <div className="h-20 bg-gray-700 rounded w-full"></div>
            </div>
          ))
        ) : contents.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">还没有内容，点击右上角生成</p>
            <button
              onClick={generateContent}
              className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
            >
              生成第一条内容
            </button>
          </div>
        ) : (
          contents.map((c) => (
            <ContentCard
              key={c.id}
              content={c}
              onCopy={copyContent}
              copied={copied === c.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ContentCard({ content, onCopy, copied }) {
  const typeColors = {
    xiaohongshu: 'text-pink-400 bg-pink-500/10',
    douyin: 'text-blue-400 bg-blue-500/10',
    comparison: 'text-purple-400 bg-purple-500/10',
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs rounded ${typeColors[content.content_type] || 'text-gray-400 bg-gray-700'}`}>
            {content.content_type === 'xiaohongshu' ? '小红书' :
             content.content_type === 'douyin' ? '抖音脚本' : '对比文案'}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded ${
            content.status === 'published' ? 'bg-green-500/10 text-green-400' :
            content.status === 'draft' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-700 text-gray-400'
          }`}>
            {content.status === 'published' ? '已发布' : content.status === 'draft' ? '草稿' : '待发布'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCopy(content.body || content.title, content.id)}
            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="复制"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="编辑">
            <Edit2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="预览">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-medium mb-2">{content.title || '无标题'}</h3>
        <p className="text-sm text-gray-400 whitespace-pre-line leading-relaxed line-clamp-4">
          {content.body || content.video_script || '无内容'}
        </p>
        {content.hashtags && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {content.hashtags.split(' ').filter(Boolean).map((tag, i) => (
              <span key={i} className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
