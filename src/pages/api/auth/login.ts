import type { APIRoute } from "astro";
import { db } from "@/db";
import { users } from "@/db/schema";
import { comparePassword, signToken, setSessionCookie } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Correo y contraseña son requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Credenciales inválidas" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Credenciales inválidas" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = await signToken(payload);
    setSessionCookie(cookies, token);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
