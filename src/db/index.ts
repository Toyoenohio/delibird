import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function getDatabaseClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    "postgresql://placeholder:placeholder@localhost:5432/placeholder";

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export const db = getDatabaseClient();
