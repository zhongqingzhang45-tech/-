import { BookOpenCheck, PenTool, Mic, Headphones, Sparkles } from 'lucide-react';

const features = [
  {
    icon: BookOpenCheck,
    title: '单词记忆',
    description: '智能闪卡系统，根据艾宾浩斯遗忘曲线安排复习，让单词记忆更高效持久。',
    color: 'from-indigo-500 to-purple-600',
    bgColor: 'bg-indigo-50',
  },
  {
    icon: PenTool,
    title: '语法练习',
    description: '系统化的语法知识点讲解，配合大量练习题和详细解析，夯实语法基础。',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
  },
  {
    icon: Mic,
    title: '口语跟读',
    description: 'AI 智能发音评测，逐音节分析发音准确度，帮助你练就地道口语。',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Headphones,
    title: '听力训练',
    description: '丰富的听力素材，从慢到快循序渐进，支持逐句精听和听写模式。',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
  },
];

export function Features() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            核心功能
          </span>
          <h2 className="font-display text-4xl font-bold text-slate-900 mt-4">
            四大学习模块，全方位提升
          </h2>
          <p className="text-slate-500 mt-4">
            从词汇、语法到口语、听力，科学的学习方法让你的语言能力全面提升
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`${feature.bgColor} rounded-3xl p-8 card-hover group`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {feature.title}
              </h3>

              <p className="text-slate-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
