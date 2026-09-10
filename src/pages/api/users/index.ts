import type { APIRoute } from "astro";
import { db } from "@/db";
import { users, userWebsites } from "@/db/schema";
import { getCurrentUserWithSites, hashPassword } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  const user = await getCurrentUserWithSites(request, cookies);
  if (!user || user.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Permiso denegado: solo admin" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    const assignments = await db.select().from(userWebsites);

    const usersWithSites = allUsers.map((u) => {
      const assigned = assignments
        .filter((a) => a.userId === u.id)
        .map((a) => a.websiteId);
      return {
        ...u,
        assignedWebsiteIds: assigned,
      };
    });

    return new Response(
      JSON.stringify({ users: usersWithSites }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error al obtener usuarios" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getCurrentUserWithSites(request, cookies);
  if (!user || user.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Permiso denegado: solo admin" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { name, email, password, role, websiteIds, assignedWebsiteIds } = await request.json();
    const targetWebsites = Array.isArray(assignedWebsiteIds) ? assignedWebsiteIds : websiteIds;

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Nombre, correo y contraseña son requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Ya existe un usuario con este correo electrónico" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: role || "operator",
      })
      .returning();

    if (role === "operator" && Array.isArray(targetWebsites) && targetWebsites.length > 0) {
      const assignments = targetWebsites.map((siteId: string) => ({
        userId: newUser.id,
        websiteId: siteId,
      }));
      await db.insert(userWebsites).values(assignments);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error al crear usuario" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
