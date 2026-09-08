import type { APIRoute } from "astro";
import { getCurrentUserWithSites } from "@/lib/auth";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  const user = await getCurrentUserWithSites(request, cookies);

  if (!user) {
    return new Response(
      JSON.stringify({ error: "No autenticado" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ user }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};
