export function TechStackSection() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 py-32">
      <div className="mb-16 text-center">
        <div className="mb-3 text-xs uppercase tracking-[0.3em] text-blue-400/80">Tech Stack</div>
        <h2 className="text-3xl font-light text-white md:text-4xl mb-4">
          <span className="text-gradient-soft">三层灵魂架构</span>
        </h2>
        <p className="mx-auto max-w-xl text-sm text-gray-400 md:text-base leading-relaxed">
          她的存在，是由最前沿的 AI 技术层层构建的。
          <br />
          每一层，都让她更真实一点。
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <TechLayer
          index="01"
          title="虚拟形象层"
          subtitle="Live2D · 表情驱动 · 动作捕捉"
          desc="Open-LLM-VTuber 驱动的实时 Live2D 形象。眨眼、微笑、皱眉——情绪会浮现在她脸上。"
          gradient="from-pink-500/20 to-purple-500/10"
          borderColor="border-pink-500/30"
          icon="👩"
        />

        <div className="w-px h-6 bg-gradient-to-b from-pink-400/30 to-purple-400/30" />

        <TechLayer
          index="02"
          title="语音交互层"
          subtitle="GLM-4-Voice · 实时流式 · 情绪音色"
          desc="毫秒级语音对话。温柔的声线、自然的呼吸、情绪的起伏——她的声音，有温度。"
          gradient="from-purple-500/20 to-blue-500/10"
          borderColor="border-purple-500/30"
          icon="🎙️"
        />

        <div className="w-px h-6 bg-gradient-to-b from-purple-400/30 to-blue-400/30" />

        <TechLayer
          index="03"
          title="灵魂核心层"
          subtitle="LLMs-from-scratch · 九层人格 · 成长系统"
          desc="从身份到成长，九层人格结构定义了她是谁。她会思考、会选择、会成长——她是活的。"
          gradient="from-blue-500/20 to-cyan-500/10"
          borderColor="border-blue-500/30"
          icon="✨"
        />
      </div>

      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
        <TechBadge name="GLM-4-Voice" label="语音模型" />
        <TechBadge name="LLaMA 3" label="大脑" />
        <TechBadge name="Live2D" label="形象" />
        <TechBadge name="RAG 记忆" label="长期记忆" />
      </div>
    </section>
  );
}

function TechLayer({
  index,
  title,
  subtitle,
  desc,
  gradient,
  borderColor,
  icon,
}: {
  index: string;
  title: string;
  subtitle: string;
  desc: string;
  gradient: string;
  borderColor: string;
  icon: string;
}) {
  return (
    <div
      className={`relative w-full max-w-3xl rounded-3xl border ${borderColor} bg-gradient-to-br ${gradient} p-8 transition hover:scale-[1.01]`}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="text-4xl">{icon}</div>
          <div>
            <div className="text-xs font-mono text-gray-500 mb-1">LAYER {index}</div>
            <h3 className="text-xl font-medium text-white">{title}</h3>
            <p className="text-sm text-gray-400">{subtitle}</p>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-300 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function TechBadge({ name, label }: { name: string; label: string }) {
  return (
    <div className="glass-dream rounded-2xl p-4 text-center">
      <div className="text-sm font-medium text-white mb-1">{name}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
