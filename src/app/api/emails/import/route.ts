import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emails, websites } from "@/db/schema";
import { getCurrentUserWithSites } from "@/lib/auth";
import { ParsedEmailRecord } from "@/lib/csv";

export async function POST(req: NextRequest) {
  const user = await getCurrentUserWithSites();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { records, defaultWebsiteId }: { records: ParsedEmailRecord[]; defaultWebsiteId?: string } =
      await req.json();

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "No se enviaron registros válidos para importar" },
        { status: 400 }
      );
    }

    // If default website is selected, check permission for operator
    if (defaultWebsiteId && user.role === "operator" && !user.assignedWebsiteIds.includes(defaultWebsiteId)) {
      return NextResponse.json(
        { error: "No tienes permiso para importar en este sitio web" },
        { status: 403 }
      );
    }

    // Fetch existing websites
    const allWebsites = await db.select().from(websites);

    const valuesToInsert = records.map((rec) => {
      let matchedWebsiteId: string | null = defaultWebsiteId || null;

      if (!matchedWebsiteId && rec.sourceUrl) {
        // Try to match domain
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

    // Bulk insert in chunks of 100
    const chunkSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < valuesToInsert.length; i += chunkSize) {
      const chunk = valuesToInsert.slice(i, i + chunkSize);
      await db.insert(emails).values(chunk);
      totalInserted += chunk.length;
    }

    return NextResponse.json({
      success: true,
      count: totalInserted,
      message: `Se importaron ${totalInserted} registros correctamente`,
    });
  } catch (error: any) {
    console.error("Error importing emails:", error);
    return NextResponse.json(
      { error: error?.message || "Error al importar correos" },
      { status: 500 }
    );
  }
}
