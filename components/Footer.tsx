export function Footer() {
  return (
    <footer className="mx-auto mt-24 w-full max-w-6xl px-6 pb-12">
      <div className="flex flex-col items-start justify-between gap-6 border-t border-white/5 pt-10 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-500 text-sm font-bold text-ink-950">
              L
            </div>
            <div className="text-base font-semibold text-white">LifeOS</div>
          </div>
          <p className="mt-2 max-w-md text-xs text-gray-500">
            AI Business Operating System · 用 AI 的力量，让每一个人都能经营属于自己的"公司"。
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
          <a className="hover:text-brand-300" href="#">产品</a>
          <a className="hover:text-brand-300" href="#">定价</a>
          <a className="hover:text-brand-300" href="#">文档</a>
          <a className="hover:text-brand-300" href="#">API</a>
          <a className="hover:text-brand-300" href="#">联系我们</a>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-3 text-[11px] text-gray-600 md:flex-row md:items-center">
        <div>© {new Date().getFullYear()} LifeOS. All rights reserved.</div>
        <div className="font-mono">
          ai.lifesys.top · v2.0
        </div>
      </div>
    </footer>
  );
}
