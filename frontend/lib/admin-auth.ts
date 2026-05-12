import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { getMongoClient, getMongoConfig } from "@/lib/mongo";

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

const SESSION_COOKIE = "omnidesk_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

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

async function getCollections() {
  const client = await getMongoClient();
  const { dbName, usersCollection, sessionsCollection } = getMongoConfig();
  const db = client.db(dbName);

  return {
    users: db.collection<AdminUser>(usersCollection),
    sessions: db.collection<SessionRecord>(sessionsCollection),
  };
}

async function cleanupExpiredSessions() {
  const { sessions } = await getCollections();
  await sessions.deleteMany({
    expiresAt: { $lte: new Date().toISOString() },
  });
}

export async function isSignupOpen() {
  return true;
}

export async function createAdmin(input: {
  name: string;
  email: string;
  password: string;
}) {
  const { users } = await getCollections();
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingUser = await users.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new Error("An admin account with this email already exists.");
  }

  const admin: AdminUser = {
    id: randomBytes(12).toString("hex"),
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };

  await users.insertOne(admin);
  return admin;
}

export async function authenticateAdmin(email: string, password: string) {
  const { users } = await getCollections();
  const user = await users.findOne({ email: email.trim().toLowerCase() });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return user;
}

export async function createSession(userId: string) {
  await cleanupExpiredSessions();

  const { sessions } = await getCollections();
  const token = randomBytes(32).toString("hex");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_DURATION_MS);

  await sessions.deleteMany({ userId });
  await sessions.insertOne({
    token,
    userId,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });

  return token;
}

export async function revokeSession(token: string) {
  const { sessions } = await getCollections();
  await sessions.deleteOne({ token });
}

export async function getSessionUser(token?: string | null) {
  if (!token) return null;

  await cleanupExpiredSessions();

  const { users, sessions } = await getCollections();
  const session = await sessions.findOne({ token });

  if (!session) {
    return null;
  }

  return users.findOne({ id: session.userId });
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
