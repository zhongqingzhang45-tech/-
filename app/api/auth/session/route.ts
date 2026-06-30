import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

interface User {
  id: string;
  email: string;
  nickname: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  avatar?: string;
  gender?: "male" | "female";
  birthDate?: string;
  bio?: string;
  settings?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
  };
}

interface UsersDB {
  users: User[];
  version: number;
}

interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

interface SessionsDB {
  sessions: Session[];
}

async function loadUsers(): Promise<UsersDB> {
  try {
    const data = await readFile(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { users: [], version: 1 };
  }
}

async function loadSessions(): Promise<SessionsDB> {
  try {
    const data = await readFile(SESSIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { sessions: [] };
  }
}

// GET /api/auth/session - Validate session and get current user
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");

    if (!sessionId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const sessionsDb = await loadSessions();
    const session = sessionsDb.sessions.find((s) => s.id === sessionId);

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      // Remove expired session
      sessionsDb.sessions = sessionsDb.sessions.filter(
        (s) => s.id !== sessionId
      );
      await require("fs/promises").writeFile(
        SESSIONS_FILE,
        JSON.stringify(sessionsDb, null, 2)
      );
      return NextResponse.json({ authenticated: false, expired: true }, { status: 401 });
    }

    const db = await loadUsers();
    const user = db.users.find((u) => u.id === session.userId);

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { passwordHash, salt, ...userWithoutSensitive } = user;

    return NextResponse.json({
      authenticated: true,
      user: userWithoutSensitive,
      session: {
        id: session.id,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error("Session validation failed:", error);
    return NextResponse.json(
      { error: "Session validation failed" },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/session - Logout (invalidate session)
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id");

    if (!sessionId) {
      return NextResponse.json({ error: "No session provided" }, { status: 400 });
    }

    const sessionsDb = await loadSessions();
    const initialLength = sessionsDb.sessions.length;
    sessionsDb.sessions = sessionsDb.sessions.filter((s) => s.id !== sessionId);

    if (sessionsDb.sessions.length === initialLength) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await require("fs/promises").writeFile(
      SESSIONS_FILE,
      JSON.stringify(sessionsDb, null, 2)
    );

    return NextResponse.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout failed:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
