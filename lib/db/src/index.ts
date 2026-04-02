import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const rawUrl = new URL(process.env.DATABASE_URL);
const useSSL = rawUrl.searchParams.get("sslmode") !== "disable";
rawUrl.searchParams.delete("channel_binding");
rawUrl.searchParams.delete("sslmode");
const connectionString = rawUrl.toString();

export const pool = new Pool({
  connectionString,
  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
