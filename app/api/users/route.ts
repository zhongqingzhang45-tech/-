import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export interface User {
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

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function loadUsers(): Promise<UsersDB> {
  await ensureDataDir();
  try {
    const data = await readFile(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { users: [], version: 1 };
  }
}

async function saveUsers(db: UsersDB) {
  await ensureDataDir();
  await writeFile(USERS_FILE, JSON.stringify(db, null, 2));
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateId(): string {
  return crypto.randomBytes(16).toString("hex");
}

// GET /api/users - List users (with pagination and search)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const db = await loadUsers();
    let filtered = db.users;

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(lowerSearch) ||
          u.nickname.toLowerCase().includes(lowerSearch)
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const users = filtered.slice(offset, offset + limit).map((u) => ({
      ...u,
      passwordHash: undefined,
      salt: undefined,
    }));

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to list users:", error);
    return NextResponse.json(
      { error: "Failed to list users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nickname, gender } = body;

    if (!email || !password || !nickname) {
      return NextResponse.json(
        { error: "Email, password, and nickname are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = await loadUsers();

    // Check if email already exists
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const now = new Date().toISOString();

    const newUser: User = {
      id: generateId(),
      email: email.toLowerCase(),
      nickname,
      passwordHash,
      salt,
      createdAt: now,
      updatedAt: now,
      gender: gender || "male",
      settings: {
        theme: "dark",
        language: "zh-CN",
        notifications: true,
      },
    };

    db.users.push(newUser);
    await saveUsers(db);

    const { passwordHash: _, salt: __, ...userWithoutSensitive } = newUser;

    return NextResponse.json(
      { user: userWithoutSensitive, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
