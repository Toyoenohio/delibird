import type { APIRoute } from "astro";
import { db } from "@/db";
import { emails, emailStatusHistory, websites } from "@/db/schema";
import { getCurrentUserWithSites } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { extractDomain, getDomainColor } from "@/lib/utils";

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
    const [foundEmail] = await db
      .select({
        id: emails.id,
        websiteId: emails.websiteId,
        sourceUrl: emails.sourceUrl,
        senderName: emails.senderName,
        senderEmail: emails.senderEmail,
        senderPhone: emails.senderPhone,
        subject: emails.subject,
        message: emails.message,
        status: emails.status,
        createdAt: emails.createdAt,
        updatedAt: emails.updatedAt,
        websiteName: websites.name,
        websiteColor: websites.colorTag,
      })
      .from(emails)
      .leftJoin(websites, eq(emails.websiteId, websites.id))
      .where(eq(emails.id, id))
      .limit(1);

    if (!foundEmail) {
      return new Response(
        JSON.stringify({ error: "Correo no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (
      user.role === "operator" &&
      foundEmail.websiteId &&
      !user.assignedWebsiteIds.includes(foundEmail.websiteId)
    ) {
      return new Response(
        JSON.stringify({ error: "Acceso denegado a este correo" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const domain = extractDomain(foundEmail.sourceUrl);
    const formattedEmail = {
      ...foundEmail,
      websiteName: foundEmail.websiteName || domain,
      websiteColor: foundEmail.websiteColor || getDomainColor(domain),
    };

    return new Response(
      JSON.stringify({ email: formattedEmail }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error fetching single email:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error al obtener el correo" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const PATCH: APIRoute = async ({ request, cookies, params }) => {
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
    const { status } = await request.json();

    const [existing] = await db
      .select()
      .from(emails)
      .where(eq(emails.id, id))
      .limit(1);

    if (!existing) {
      return new Response(
        JSON.stringify({ error: "Correo no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (
      user.role === "operator" &&
      existing.websiteId &&
      !user.assignedWebsiteIds.includes(existing.websiteId)
    ) {
      return new Response(
        JSON.stringify({ error: "Permiso denegado para editar este registro" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const previousStatus = existing.status;

    if (status && status !== previousStatus) {
      const [updated] = await db
        .update(emails)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(emails.id, id))
        .returning();

      await db.insert(emailStatusHistory).values({
        emailId: id,
        userId: user.id,
        previousStatus,
        newStatus: status,
      });

      return new Response(
        JSON.stringify({ success: true, email: updated }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, email: existing }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error updating email:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error al actualizar el correo" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const DELETE: APIRoute = async ({ request, cookies, params }) => {
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
    const [existing] = await db
      .select()
      .from(emails)
      .where(eq(emails.id, id))
      .limit(1);

    if (!existing) {
      return new Response(
        JSON.stringify({ error: "Correo no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (
      user.role === "operator" &&
      existing.websiteId &&
      !user.assignedWebsiteIds.includes(existing.websiteId)
    ) {
      return new Response(
        JSON.stringify({ error: "Permiso denegado para eliminar este registro" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    await db.delete(emails).where(eq(emails.id, id));
    return new Response(
      JSON.stringify({ success: true, message: "Correo eliminado correctamente" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error deleting email:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error al eliminar el correo" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
