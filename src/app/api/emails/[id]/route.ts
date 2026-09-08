import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emails, emailNotes, emailStatusHistory, users, websites } from "@/db/schema";
import { getCurrentUserWithSites } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserWithSites();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const [record] = await db
      .select({
        id: emails.id,
        websiteId: emails.websiteId,
        websiteName: websites.name,
        websiteColor: websites.colorTag,
        sourceUrl: emails.sourceUrl,
        senderName: emails.senderName,
        senderEmail: emails.senderEmail,
        senderPhone: emails.senderPhone,
        subject: emails.subject,
        message: emails.message,
        status: emails.status,
        createdAt: emails.createdAt,
        updatedAt: emails.updatedAt,
      })
      .from(emails)
      .leftJoin(websites, eq(emails.websiteId, websites.id))
      .where(eq(emails.id, id))
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }

    // Permission check for operators
    if (user.role === "operator" && record.websiteId && !user.assignedWebsiteIds.includes(record.websiteId)) {
      return NextResponse.json({ error: "No tienes permiso para ver este registro" }, { status: 403 });
    }

    // Fetch notes
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

    // Fetch status history
    const history = await db
      .select({
        id: emailStatusHistory.id,
        previousStatus: emailStatusHistory.previousStatus,
        newStatus: emailStatusHistory.newStatus,
        createdAt: emailStatusHistory.createdAt,
        userName: users.name,
      })
      .from(emailStatusHistory)
      .leftJoin(users, eq(emailStatusHistory.userId, users.id))
      .where(eq(emailStatusHistory.emailId, id))
      .orderBy(desc(emailStatusHistory.createdAt));

    return NextResponse.json({
      email: record,
      notes,
      history,
    });
  } catch (error) {
    console.error("Error getting email details:", error);
    return NextResponse.json({ error: "Error al obtener detalle" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserWithSites();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { status } = await req.json();

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
      return NextResponse.json({ error: "No tienes permiso para modificar este registro" }, { status: 403 });
    }

    const previousStatus = existing.status;

    // Update status
    const [updated] = await db
      .update(emails)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(emails.id, id))
      .returning();

    // Record in audit trail
    if (previousStatus !== status) {
      await db.insert(emailStatusHistory).values({
        emailId: id,
        userId: user.id,
        previousStatus,
        newStatus: status,
      });
    }

    return NextResponse.json({ success: true, email: updated });
  } catch (error) {
    console.error("Error updating email status:", error);
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
  }
}
