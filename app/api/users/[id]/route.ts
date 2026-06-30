import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

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

async function loadUsers(): Promise<UsersDB> {
  try {
    const data = await readFile(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { users: [], version: 1 };
  }
}

async function saveUsers(db: UsersDB) {
  await writeFile(USERS_FILE, JSON.stringify(db, null, 2));
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/users/[id] - Get user by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = await loadUsers();
    const user = db.users.find((u) => u.id === id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { passwordHash, salt, ...userWithoutSensitive } = user;
    return NextResponse.json({ user: userWithoutSensitive });
  } catch (error) {
    console.error("Failed to get user:", error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = await loadUsers();
    const userIndex = db.users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = db.users[userIndex];
    const allowedUpdates = [
      "nickname",
      "avatar",
      "gender",
      "birthDate",
      "bio",
      "settings",
    ];

    const updates: Partial<User> = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        (updates as any)[key] = body[key];
      }
    }

    // Handle password change
    if (body.newPassword) {
      if (!body.currentPassword) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }
      const currentHash = hashPassword(body.currentPassword, user.salt);
      if (currentHash !== user.passwordHash) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        );
      }
      updates.passwordHash = hashPassword(body.newPassword, user.salt);
    }

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    db.users[userIndex] = updatedUser;
    await saveUsers(db);

    const { passwordHash, salt, ...userWithoutSensitive } = updatedUser;
    return NextResponse.json({
      user: userWithoutSensitive,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = await loadUsers();
    const userIndex = db.users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    db.users.splice(userIndex, 1);
    await saveUsers(db);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
