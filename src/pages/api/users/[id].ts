import type { APIRoute } from "astro";
import { db } from "@/db";
import { users, userWebsites } from "@/db/schema";
import { getCurrentUserWithSites, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const prerender = false;

export const PATCH: APIRoute = async ({ request, cookies, params }) => {
  const user = await getCurrentUserWithSites(request, cookies);
  if (!user || user.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Permiso denegado: solo admin" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
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
    const { name, email, password, role, websiteIds } = await request.json();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (role) updateData.role = role;
    if (password && password.trim().length > 0) {
      updateData.passwordHash = await hashPassword(password);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    // Re-assign websites
    if (Array.isArray(websiteIds)) {
      await db.delete(userWebsites).where(eq(userWebsites.userId, id));

      if (websiteIds.length > 0 && (role === "operator" || (!role && updatedUser.role === "operator"))) {
        const assignments = websiteIds.map((siteId: string) => ({
          userId: id,
          websiteId: siteId,
        }));
        await db.insert(userWebsites).values(assignments);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error updating user:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error al actualizar usuario" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const DELETE: APIRoute = async ({ request, cookies, params }) => {
  const user = await getCurrentUserWithSites(request, cookies);
  if (!user || user.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Permiso denegado: solo admin" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const { id } = params;
  if (!id) {
    return new Response(
      JSON.stringify({ error: "ID requerido" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (user.id === id) {
    return new Response(
      JSON.stringify({ error: "No puedes eliminar tu propia cuenta de administrador" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await db.delete(users).where(eq(users.id, id));
    return new Response(
      JSON.stringify({ success: true, message: "Usuario eliminado correctamente" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error al eliminar usuario" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
