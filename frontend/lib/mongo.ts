import { readFileSync } from "fs";
import path from "path";
import { MongoClient } from "mongodb";

let cachedClient: MongoClient | null = null;

function readBackendEnvValue(key: string) {
  try {
    const envPath = path.join(process.cwd(), "..", "backend", ".env");
    const raw = readFileSync(envPath, "utf8");
    const match = raw.match(new RegExp(`^${key}=(.*)$`, "m"));
    return match?.[1]?.trim() || "";
  } catch {
    return "";
  }
}

export function getMongoConfig() {
  const uri =
    process.env.MONGODB_ATLAS_URI || readBackendEnvValue("MONGODB_ATLAS_URI");
  const dbName =
    process.env.MONGODB_DB_NAME ||
    readBackendEnvValue("MONGODB_DB_NAME") ||
    "omnidesk";
  const usersCollection =
    process.env.MONGODB_ADMIN_USERS_COLLECTION_NAME || "admin_users";
  const sessionsCollection =
    process.env.MONGODB_ADMIN_SESSIONS_COLLECTION_NAME || "admin_sessions";

  if (!uri) {
    throw new Error(
      "MongoDB configuration is missing for admin authentication."
    );
  }

  return { uri, dbName, usersCollection, sessionsCollection };
}

export async function getMongoClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const { uri } = getMongoConfig();
  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  return cachedClient;
}
