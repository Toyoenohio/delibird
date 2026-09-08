import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, userWebsites } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { AstroCookies } from "astro";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_jwt_secret_change_me_in_production_32_characters_minimum"
);

export const COOKIE_NAME = "session_token";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "operator";
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function parseCookieHeader(cookieHeader?: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const list: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts.shift()?.trim();
    if (key) {
      list[key] = decodeURI(parts.join("=").trim());
    }
  });
  return list;
}

export async function getSessionFromRequest(request: Request, cookies?: AstroCookies): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (cookies) {
    token = cookies.get(COOKIE_NAME)?.value;
  }

  if (!token) {
    const cookieHeader = request.headers.get("cookie");
    const parsed = parseCookieHeader(cookieHeader);
    token = parsed[COOKIE_NAME];
  }

  if (!token) return null;
  return await verifyToken(token);
}

export async function getCurrentUserWithSites(request: Request, cookies?: AstroCookies) {
  const session = await getSessionFromRequest(request, cookies);
  if (!session) return null;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) return null;

  let assignedWebsiteIds: string[] = [];
  if (user.role === "operator") {
    const assigned = await db
      .select({ websiteId: userWebsites.websiteId })
      .from(userWebsites)
      .where(eq(userWebsites.userId, user.id));
    assignedWebsiteIds = assigned.map((a) => a.websiteId);
  }

  return {
    ...user,
    assignedWebsiteIds,
  };
}

export function setSessionCookie(cookies: AstroCookies, token: string) {
  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function removeSessionCookie(cookies: AstroCookies) {
  cookies.delete(COOKIE_NAME, {
    path: "/",
  });
}
