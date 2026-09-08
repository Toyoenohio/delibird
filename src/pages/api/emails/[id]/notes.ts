import type { APIRoute } from "astro";
import { db } from "@/db";
import { emailNotes, users } from "@/db/schema";
import { getCurrentUserWithSites } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, params }) => {
  const user = await getCurrentUserWithSites(request, cookies);
  if (!user) {
    return new Response(
      JSON.stringify({ error: "No autorizado" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const { id } = params;
  if (!id) {
    return new Response(
      JSON.stringify({ error: "ID requerido" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const notes = await db
      .select({
        id: emailNotes.id,
        note: emailNotes.note,
        createdAt: emailNotes.createdAt,
        userName: users.name,
        userRole: users.role,
      })
      .from(emailNotes)
      .leftJoin(users, eq(emailNotes.userId, users.id))
      .where(eq(emailNotes.emailId, id))
      .orderBy(desc(emailNotes.createdAt));

    return new Response(
      JSON.stringify({ notes }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error fetching notes:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error al obtener notas" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies, params }) => {
  const user = await getCurrentUserWithSites(request, cookies);
  if (!user) {
    return new Response(
      JSON.stringify({ error: "No autorizado" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const { id } = params;
  if (!id) {
    return new Response(
      JSON.stringify({ error: "ID requerido" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { note } = await request.json();

    if (!note || !note.trim()) {
      return new Response(
        JSON.stringify({ error: "La nota no puede estar vacía" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const [newNote] = await db
      .insert(emailNotes)
      .values({
        emailId: id,
        userId: user.id,
        note: note.trim(),
      })
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        note: {
          ...newNote,
          userName: user.name,
          userRole: user.role,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error adding note:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error al agregar nota" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
