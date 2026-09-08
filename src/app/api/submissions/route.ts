import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emails, websites } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    },
  });
}

export async function POST(req: NextRequest) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
  };

  try {
    const body = await req.json();

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
      return NextResponse.json(
        { error: "Correo del remitente y mensaje son requeridos" },
        { status: 400, headers: corsHeaders }
      );
    }

    const finalSourceUrl =
      sourceUrl ||
      req.headers.get("referer") ||
      req.headers.get("origin") ||
      "API Directa";

    // The database trigger automatically creates/links the website if websiteId is omitted!
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

    return NextResponse.json(
      {
        success: true,
        message: "Formulario registrado exitosamente",
        id: newEmail.id,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error saving submission:", error);
    return NextResponse.json(
      { error: error?.message || "Error al procesar el formulario" },
      { status: 500, headers: corsHeaders }
    );
  }
}
