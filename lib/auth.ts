// Shared auth store (in-memory for demo)
// In production, replace with a real database (e.g., Prisma + PostgreSQL)

interface User {
  email: string;
  password: string;
  name: string;
  createdAt: number;
}

const users = new Map<string, User>();

export function createUser(email: string, password: string, name: string): User | null {
  if (users.has(email)) return null;
  const user: User = { email, password, name: name.trim(), createdAt: Date.now() };
  users.set(email, user);
  return user;
}

export function findUser(email: string): User | undefined {
  return users.get(email);
}

export function generateToken(email: string): string {
  return Buffer.from(`${email}:${Date.now()}`).toString("base64");
}
