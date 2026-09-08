import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, userWebsites } from "@/db/schema";
import { getCurrentUserWithSites, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUserWithSites();
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Permiso denegado: solo admin" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { name, email, password, role, assignedWebsiteIds } = await req.json();

    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (role) updateData.role = role;
    if (password && password.trim().length > 0) {
      updateData.passwordHash = await hashPassword(password);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Update website assignments if provided
    if (Array.isArray(assignedWebsiteIds)) {
      await db.delete(userWebsites).where(eq(userWebsites.userId, id));

      if (assignedWebsiteIds.length > 0 && updatedUser.role === "operator") {
        await db.insert(userWebsites).values(
          assignedWebsiteIds.map((websiteId: string) => ({
            userId: id,
            websiteId,
          }))
        );
      }
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUserWithSites();
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Permiso denegado: solo admin" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent deleting oneself
  if (currentUser.id === id) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propia cuenta de administrador" },
      { status: 400 }
    );
  }

  try {
    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ success: true, message: "Usuario eliminado" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
