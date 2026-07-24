import dynamic from "next/dynamic";

const LoverApp = dynamic(() => import("@/components/Lover/LoverApp").then(m => ({ default: m.LoverApp })), {
  ssr: false,
  loading: () => (
    <div
      className="h-screen w-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#0a0a0f" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl animate-pulse gradient-jade shadow-lg shadow-brand-500/20" />
        <div className="text-ink-400 text-sm">灵犀正在醒来...</div>
      </div>
    </div>
  ),
});

export default function LoverPage() {
  return <LoverApp />;
}
