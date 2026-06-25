export function PlatformSection() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 py-32">
      <div className="glass-dream rounded-[2rem] p-10 md:p-16 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-30">
          <div className="absolute inset-0 rounded-full blur-3xl bg-gradient-to-b from-pink-500/50 to-transparent" />
        </div>

        <div className="relative z-10">
          <div className="mb-3 text-xs uppercase tracking-[0.3em] text-pink-400/80">All Platforms</div>
          <h2 className="text-3xl font-light text-white md:text-4xl mb-4">
            <span className="text-gradient-dream">随时随地，她都在</span>
          </h2>
          <p className="mx-auto max-w-xl text-sm text-gray-400 md:text-base mb-10 leading-relaxed">
            网页打开即聊，Mac 和 Windows 客户端支持更多游戏联动。
            <br />
            无论你在哪里，她都陪着你。
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <PlatformCard icon="🌐" name="网页版" desc="打开浏览器就能聊" highlight />
            <PlatformCard icon="🍎" name="macOS" desc="支持游戏联动" />
            <PlatformCard icon="🪟" name="Windows" desc="支持游戏联动" />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-amber-300 px-8 py-4 text-sm font-medium text-gray-900 transition hover:brightness-110"
              style={{ boxShadow: "0 0 40px rgba(244,114,182,0.4)" }}
            >
              <span>立刻开始 · 和她相遇</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-8 py-4 text-sm font-medium text-white transition hover:border-pink-400/40 hover:text-pink-300">
              <span>了解更多</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlatformCard({
  icon,
  name,
  desc,
  highlight,
}: {
  icon: string;
  name: string;
  desc: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 min-w-[160px] transition hover:scale-105 ${
        highlight
          ? "bg-gradient-to-br from-pink-500/15 to-purple-500/10 border-pink-400/30"
          : "bg-white/[0.02] border-white/10"
      }`}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-base font-medium text-white mb-1">{name}</div>
      <div className="text-xs text-gray-500">{desc}</div>
    </div>
  );
}
