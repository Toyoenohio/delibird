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
      senderName,
      senderEmail,
      senderPhone,
      subject,
      message,
      websiteId,
    } = body;

    if (!senderEmail || !message) {
      return new Response(
        JSON.stringify({ error: "Correo del remitente y mensaje son requeridos" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const finalSourceUrl =
      sourceUrl ||
      request.headers.get("referer") ||
      request.headers.get("origin") ||
      "API Directa";

    // Neon PostgreSQL Trigger automatically handles website creation/linking if websiteId is omitted!
    const [newEmail] = await db
      .insert(emails)
      .values({
        websiteId: websiteId || null,
        sourceUrl: finalSourceUrl,
        senderName: senderName || "Sin Nombre",
        senderEmail: senderEmail.trim(),
        senderPhone: senderPhone || null,
        subject: subject || "Contacto desde sitio web",
        message: message.trim(),
        status: "nuevo",
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
