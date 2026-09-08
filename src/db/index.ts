import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let cachedDb: any = null;
let cachedUrl: string | null = null;

export function getDatabaseClient() {
  const rawUrl =
    (typeof process !== "undefined" ? process.env?.DATABASE_URL : undefined) ||
    (typeof process !== "undefined" ? process.env?.DATABASE_URL_UNPOOLED : undefined) ||
    (import.meta as any).env?.DATABASE_URL;

  if (!rawUrl || !rawUrl.trim() || rawUrl.includes("placeholder")) {
    throw new Error(
      "DATABASE_URL no está configurada o está vacía en Cloudflare Pages. Por favor verifica Settings > Environment Variables en tu Cloudflare Dashboard."
    );
  }

  let connectionString = rawUrl.trim();
  if (!connectionString.startsWith("postgresql://") && !connectionString.startsWith("postgres://")) {
    if (connectionString.includes("@")) {
      connectionString = `postgresql://${connectionString}`;
    }
  }

  if (cachedDb && cachedUrl === connectionString) {
    return cachedDb;
  }

  const sql = neon(connectionString);
  cachedDb = drizzle(sql, { schema });
  cachedUrl = connectionString;
  return cachedDb;
}

// Proxy allows lazy execution so DATABASE_URL is read dynamically at request time
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const client = getDatabaseClient();
    const val = (client as any)[prop];
    return typeof val === "function" ? val.bind(client) : val;
  },
});
