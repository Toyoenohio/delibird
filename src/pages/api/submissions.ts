import type { APIRoute } from "astro";
import { db } from "@/db";
import { emails } from "@/db/schema";

export const prerender = false;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
  "Content-Type": "application/json",
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      sourceUrl,
      source_url,
      page_url,
      senderName,
      sender_name,
      name,
      nombre,
      senderEmail,
      sender_email,
      email,
      correo,
      senderPhone,
      sender_phone,
      phone,
      telefono,
      subject,
      asunto,
      message,
      mensaje,
      websiteId,
      website_id,
      status,
      extraFields,
      extra_fields,
      ...restFields
    } = body;

    const finalEmail = (senderEmail || sender_email || email || correo || "").toString().trim();
    const finalMessage = (message || mensaje || "").toString().trim();

    if (!finalEmail || !finalMessage) {
      return new Response(
        JSON.stringify({ error: "Correo del remitente y mensaje son requeridos" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const finalSenderName = (senderName || sender_name || name || nombre || "Sin Nombre").toString().trim();
    const finalPhone = (senderPhone || sender_phone || phone || telefono || null)?.toString().trim() || null;
    const finalSubject = (subject || asunto || "Contacto desde sitio web").toString().trim();

    const finalSourceUrl =
      sourceUrl ||
      source_url ||
      page_url ||
      request.headers.get("referer") ||
      request.headers.get("origin") ||
      "API Directa";

    // Combine any explicit extra_fields object with any dynamic leftover fields
    const explicitExtras = (typeof extraFields === "object" && extraFields !== null)
      ? extraFields
      : (typeof extra_fields === "object" && extra_fields !== null)
      ? extra_fields
      : {};

    const combinedExtraFields = {
      ...explicitExtras,
      ...restFields,
    };

    // Neon PostgreSQL Trigger automatically handles website creation/linking if websiteId is omitted!
    const [newEmail] = await db
      .insert(emails)
      .values({
        websiteId: websiteId || website_id || null,
        sourceUrl: finalSourceUrl,
        senderName: finalSenderName,
        senderEmail: finalEmail,
        senderPhone: finalPhone,
        subject: finalSubject,
        message: finalMessage,
        status: status || "nuevo",
        extraFields: combinedExtraFields,
      })
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Formulario registrado exitosamente",
        id: newEmail.id,
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error saving submission:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error al procesar el formulario" }),
      { status: 500, headers: corsHeaders }
    );
  }
};
