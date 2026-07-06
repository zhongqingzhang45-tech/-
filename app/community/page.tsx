import dynamic from "next/dynamic";

const CommunityPage = dynamic(() => import("@/components/Community/CommunityPage"), {
  ssr: false,
  loading: () => (
    <div
      className="h-screen w-screen flex items-center justify-center overflow-hidden"
      style={{ background: "#0a0a0f" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl animate-pulse"
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
            boxShadow: "0 0 40px rgba(139, 92, 246, 0.4)",
          }}
        />
        <div className="text-ink-400 text-sm">加载社区中...</div>
      </div>
    </div>
  ),
});

export default function CommunityRoute() {
  return <CommunityPage />;
}