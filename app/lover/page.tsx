import dynamic from "next/dynamic";

const LoverApp = dynamic(() => import("@/components/Lover/LoverApp").then(m => ({ default: m.LoverApp })), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center overflow-hidden gf-bg">
      <div className="absolute inset-0 gf-grain" />
      <div className="relative flex flex-col items-center gap-5">
        <div className="seal w-16 h-16 text-2xl animate-breathe-soft">君心</div>
        <div className="text-ink-400 text-sm font-serif tracking-widest">墨色晕开中…</div>
      </div>
    </div>
  ),
});

export default function LoverPage() {
  return <LoverApp />;
}
