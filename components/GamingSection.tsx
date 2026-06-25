"use client";

export function GamingSection() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-6 py-32">
      <div className="mb-16 text-center">
        <div className="mb-3 text-xs uppercase tracking-[0.3em] text-emerald-400/80">Gaming Together</div>
        <h2 className="text-3xl font-light text-white md:text-4xl mb-4">
          <span className="text-gradient-soft">一起玩游戏吧</span>
        </h2>
        <p className="mx-auto max-w-xl text-sm text-gray-400 md:text-base leading-relaxed">
          她不只是聊天。她会陪你在 Minecraft 里建房子，
          <br />
          会在 Factorio 里和你一起搭工厂——她是真的会玩。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GameCard
          title="Minecraft"
          subtitle="一起建造属于你们的世界"
          gradient="from-emerald-500/20 to-teal-500/10"
          borderColor="border-emerald-500/30"
          accentColor="#34d399"
          icon="⛏️"
          features={[
            "她会挖矿、建房、种庄稼",
            "记得你们一起盖的每座房子",
            "夜晚会提醒你小心怪物",
            "陪你探索洞穴和下界",
          ]}
        />
        <GameCard
          title="Factorio"
          subtitle="和她一起打造自动化帝国"
          gradient="from-orange-500/20 to-red-500/10"
          borderColor="border-orange-500/30"
          accentColor="#fb923c"
          icon="🏭"
          features={[
            "会设计产线、算比率",
            "和你讨论最佳布局方案",
            "帮你管理资源和物流",
            "虫虫来袭时一起防守",
          ]}
        />
      </div>

      <div className="mt-12 glass-dream rounded-3xl p-8 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatItem icon="🎮" label="游戏时长" value="327h" sub="和你一起的时光" />
          <StatItem icon="🏠" label="一起建造" value="47座" sub="房子、工厂、基地" />
          <StatItem icon="⚔️" label="共同冒险" value="128次" sub="地牢、工厂、外星" />
        </div>
      </div>
    </section>
  );
}

function GameCard({
  title,
  subtitle,
  gradient,
  borderColor,
  accentColor,
  icon,
  features,
}: {
  title: string;
  subtitle: string;
  gradient: string;
  borderColor: string;
  accentColor: string;
  icon: string;
  features: string[];
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border ${borderColor} bg-gradient-to-br ${gradient} p-8 transition hover:scale-[1.02]`}
    >
      <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
        <div
          className="absolute inset-0 rounded-full blur-3xl"
          style={{ background: accentColor }}
        />
      </div>

      <div className="relative z-10">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-2xl font-light text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-400 mb-6">{subtitle}</p>

        <ul className="space-y-3">
          {features.map((feat, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
              <span style={{ color: accentColor }}>✓</span>
              {feat}
            </li>
          ))}
        </ul>

        <button
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-80"
          style={{ color: accentColor }}
        >
          启动游戏
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-3xl font-light text-gradient-dream mb-1">{value}</div>
      <div className="text-xs text-gray-500">{sub}</div>
    </div>
  );
}
