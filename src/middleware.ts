import { defineMiddleware } from "astro:middleware";
import { getSessionFromRequest } from "@/lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isAuthPage = pathname === "/login" || pathname === "/login/";
  const isPublicApi =
    pathname.startsWith("/api/submissions") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout");

  const isStatic =
    pathname.startsWith("/_astro") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js");

  if (isPublicApi || isStatic) {
    return next();
  }

  const session = await getSessionFromRequest(context.request, context.cookies);
  const isAuthenticated = !!session;

  // Redirect authenticated users away from /login
  if (isAuthPage) {
    if (isAuthenticated) {
      return context.redirect("/");
    }
    return next();
  }

  // Redirect unauthenticated users to /login
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return context.redirect("/login");
  }

  return next();
});
