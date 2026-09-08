import type { APIRoute } from "astro";
import { db } from "@/db";
import { emails, websites } from "@/db/schema";
import { getCurrentUserWithSites } from "@/lib/auth";
import type { ParsedEmailRecord } from "@/lib/csv";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getCurrentUserWithSites(request, cookies);
  if (!user) {
    return new Response(
      JSON.stringify({ error: "No autorizado" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { records, defaultWebsiteId }: { records: ParsedEmailRecord[]; defaultWebsiteId?: string } =
      await request.json();

    if (!Array.isArray(records) || records.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se enviaron registros válidos para importar" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (defaultWebsiteId && user.role === "operator" && !user.assignedWebsiteIds.includes(defaultWebsiteId)) {
      return new Response(
        JSON.stringify({ error: "No tienes permiso para importar en este sitio web" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const allWebsites = await db.select().from(websites);

    const valuesToInsert = records.map((rec) => {
      let matchedWebsiteId: string | null = defaultWebsiteId || null;

      if (!matchedWebsiteId && rec.sourceUrl) {
        const matched = allWebsites.find(
          (w) =>
            rec.sourceUrl.toLowerCase().includes(w.url.toLowerCase().replace(/https?:\/\//, "")) ||
            rec.sourceUrl.toLowerCase().includes(w.name.toLowerCase())
        );
        if (matched) {
          matchedWebsiteId = matched.id;
        }
      }

      return {
        websiteId: matchedWebsiteId,
        sourceUrl: rec.sourceUrl || "Importado CSV",
        senderName: rec.senderName || "Sin Nombre",
        senderEmail: rec.senderEmail,
        senderPhone: rec.senderPhone || null,
        subject: rec.subject || "Sin Asunto",
        message: rec.message || "Sin Mensaje",
        status: rec.status || "nuevo",
        createdAt: new Date(rec.createdAt),
        updatedAt: new Date(),
      };
    });

    const chunkSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < valuesToInsert.length; i += chunkSize) {
      const chunk = valuesToInsert.slice(i, i + chunkSize);
      await db.insert(emails).values(chunk);
      totalInserted += chunk.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: totalInserted,
        message: `Se importaron ${totalInserted} registros correctamente`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error importing emails:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error al importar correos" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
