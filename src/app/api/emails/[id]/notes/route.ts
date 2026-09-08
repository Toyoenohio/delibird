import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emails, emailNotes, users } from "@/db/schema";
import { getCurrentUserWithSites } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserWithSites();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { note } = await req.json();

    if (!note || note.trim().length === 0) {
      return NextResponse.json({ error: "La nota no puede estar vacía" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(emails)
      .where(eq(emails.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }

    // Check operator permission
    if (user.role === "operator" && existing.websiteId && !user.assignedWebsiteIds.includes(existing.websiteId)) {
      return NextResponse.json({ error: "No tienes permiso para agregar notas a este registro" }, { status: 403 });
    }

    const [newNote] = await db
      .insert(emailNotes)
      .values({
        emailId: id,
        userId: user.id,
        note: note.trim(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      note: {
        ...newNote,
        userName: user.name,
        userRole: user.role,
      },
    });
  } catch (error) {
    console.error("Error adding note:", error);
    return NextResponse.json({ error: "Error al guardar nota" }, { status: 500 });
  }
}
