import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function formatConnectionString(url?: string): string {
  if (!url || !url.trim()) {
    return "postgresql://placeholder:placeholder@localhost:5432/placeholder";
  }
  
  let trimmed = url.trim();
  
  // If user only provided the host without protocol
  if (!trimmed.startsWith("postgresql://") && !trimmed.startsWith("postgres://")) {
    if (trimmed.includes("@")) {
      trimmed = `postgresql://${trimmed}`;
    } else {
      trimmed = `postgresql://default:default@${trimmed}/neondb?sslmode=require`;
    }
  }
  
  return trimmed;
}

function getDatabaseClient() {
  const rawUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  const connectionString = formatConnectionString(rawUrl);

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export const db = getDatabaseClient();
