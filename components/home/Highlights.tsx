import { Trophy, Target, Zap, Users } from 'lucide-react';

const highlights = [
  {
    icon: Trophy,
    title: '成就激励系统',
    description: '丰富的成就徽章和等级系统，让学习像游戏一样有趣，每一点进步都值得庆祝。',
  },
  {
    icon: Target,
    title: '个性化学习路径',
    description: 'AI 智能分析你的学习数据，为你量身定制最适合的学习计划和内容推荐。',
  },
  {
    icon: Zap,
    title: '碎片时间学习',
    description: '5 分钟也能学一课，充分利用碎片时间，积少成多见证进步。',
  },
  {
    icon: Users,
    title: '学习社区',
    description: '加入志同道合的学习者社区，互相鼓励、分享经验，一起进步不孤单。',
  },
];

export function Highlights() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-pink-300/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-4xl font-bold text-white">
            为什么选择 LinguaVerse
          </h2>
          <p className="text-white/80 mt-4">
            我们致力于打造最好的语言学习体验，让每一位学习者都能享受学习的乐趣
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item, index) => (
            <div
              key={item.title}
              className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <item.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>

              <p className="text-white/80 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="font-display text-5xl font-bold text-white">50K+</div>
            <div className="text-white/70 mt-2">活跃用户</div>
          </div>
          <div>
            <div className="font-display text-5xl font-bold text-white">200+</div>
            <div className="text-white/70 mt-2">精品课程</div>
          </div>
          <div>
            <div className="font-display text-5xl font-bold text-white">98%</div>
            <div className="text-white/70 mt-2">满意度</div>
          </div>
          <div>
            <div className="font-display text-5xl font-bold text-white">3</div>
            <div className="text-white/70 mt-2">语言支持</div>
          </div>
        </div>
      </div>
    </section>
  );
}
