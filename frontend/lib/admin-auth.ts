import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

const dataDir = path.join(process.cwd(), ".data");
const usersPath = path.join(dataDir, "admin-users.json");
const sessionsPath = path.join(dataDir, "admin-sessions.json");

const SESSION_COOKIE = "omnidesk_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  await ensureDataDir();

  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return fallback;
    }

    throw error;
  }
}

async function writeJsonFile<T>(filePath: string, value: T) {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function hashPassword(password: string, salt?: string) {
  const resolvedSalt = salt || randomBytes(16).toString("hex");
  const derived = scryptSync(password, resolvedSalt, 64).toString("hex");
  return `${resolvedSalt}:${derived}`;
}

function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");
  if (!salt || !storedHash) return false;

  const candidateHash = hashPassword(password, salt).split(":")[1];
  return timingSafeEqual(
    Buffer.from(storedHash, "hex"),
    Buffer.from(candidateHash, "hex")
  );
}

async function readUsers() {
  return readJsonFile<AdminUser[]>(usersPath, []);
}

async function writeUsers(users: AdminUser[]) {
  await writeJsonFile(usersPath, users);
}

async function readSessions() {
  const sessions = await readJsonFile<SessionRecord[]>(sessionsPath, []);
  const now = Date.now();
  const activeSessions = sessions.filter(
    (session) => new Date(session.expiresAt).getTime() > now
  );

  if (activeSessions.length !== sessions.length) {
    await writeJsonFile(sessionsPath, activeSessions);
  }

  return activeSessions;
}

async function writeSessions(sessions: SessionRecord[]) {
  await writeJsonFile(sessionsPath, sessions);
}

export async function isSignupOpen() {
  const users = await readUsers();
  return users.length === 0;
}

export async function createInitialAdmin(input: {
  name: string;
  email: string;
  password: string;
}) {
  const users = await readUsers();
  if (users.length > 0) {
    throw new Error("Admin setup is already complete.");
  }

  const admin: AdminUser = {
    id: randomBytes(12).toString("hex"),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };

  await writeUsers([admin]);
  return admin;
}

export async function authenticateAdmin(email: string, password: string) {
  const users = await readUsers();
  const user = users.find(
    (candidate) => candidate.email === email.trim().toLowerCase()
  );

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return user;
}

export async function createSession(userId: string) {
  const sessions = await readSessions();
  const token = randomBytes(32).toString("hex");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_DURATION_MS);

  const nextSessions = sessions.filter((session) => session.userId !== userId);
  nextSessions.push({
    token,
    userId,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });

  await writeSessions(nextSessions);
  return token;
}

export async function revokeSession(token: string) {
  const sessions = await readSessions();
  await writeSessions(sessions.filter((session) => session.token !== token));
}

export async function getSessionUser(token?: string | null) {
  if (!token) return null;

  const [users, sessions] = await Promise.all([readUsers(), readSessions()]);
  const session = sessions.find((candidate) => candidate.token === token);

  if (!session) {
    return null;
  }

  return users.find((user) => user.id === session.userId) || null;
}

export const adminSessionCookie = {
  name: SESSION_COOKIE,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  },
};
