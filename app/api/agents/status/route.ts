import { NextResponse } from "next/server";
import { AGENT_EXPERTS } from "@/data/agents";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = AGENT_EXPERTS.map((agent) => ({
      id: agent.id,
      name: agent.name,
      status: Math.random() > 0.15 ? "online" : "busy",
      currentTask: agent.currentTask,
      taskProgress: Math.floor(Math.random() * 100),
      tasksCompletedToday: Math.floor(Math.random() * 12) + 2,
      updatedAt: new Date().toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        agents: data,
        summary: {
          online: data.filter((a) => a.status === "online").length,
          busy: data.filter((a) => a.status === "busy").length,
          runningTasks: Math.floor(Math.random() * 18) + 12,
          tasksToday: Math.floor(Math.random() * 120) + 60,
          autoExecutionRate: Math.floor(Math.random() * 15) + 85,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch agent status",
      },
      { status: 500 }
    );
  }
}
