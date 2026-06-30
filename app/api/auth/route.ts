import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

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

async function saveSessions(db: SessionsDB) {
  await writeFile(SESSIONS_FILE, JSON.stringify(db, null, 2));
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// POST /api/auth/login - User login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = await loadUsers();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordHash = hashPassword(password, user.salt);
    if (passwordHash !== user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    const now = new Date();
    const session: Session = {
      id: generateSessionId(),
      userId: user.id,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_DURATION_MS).toISOString(),
    };

    const sessionsDb = await loadSessions();
    sessionsDb.sessions = sessionsDb.sessions.filter(
      (s) => s.userId !== user.id
    );
    sessionsDb.sessions.push(session);
    await saveSessions(sessionsDb);

    // Update last login
    const userIndex = db.users.findIndex((u) => u.id === user.id);
    db.users[userIndex].lastLoginAt = now.toISOString();
    await writeFile(USERS_FILE, JSON.stringify(db, null, 2));

    const { passwordHash: _, salt, ...userWithoutSensitive } = user;

    return NextResponse.json({
      user: userWithoutSensitive,
      sessionId: session.id,
      expiresAt: session.expiresAt,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
