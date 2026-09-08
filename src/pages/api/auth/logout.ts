import type { APIRoute } from "astro";
import { removeSessionCookie } from "@/lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  removeSessionCookie(cookies);
  return new Response(
    JSON.stringify({ success: true, message: "Sesión cerrada" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
