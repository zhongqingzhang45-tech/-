import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const startTime = Date.now();
  
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "2.0.0",
    environment: process.env.NODE_ENV || "development",
    services: {
      api: "up",
      renderer: "up",
    },
    metrics: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
    responseTime: Date.now() - startTime,
  };

  return NextResponse.json(health, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Type": "application/json",
    },
  });
}
