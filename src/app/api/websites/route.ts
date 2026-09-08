import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { websites, userWebsites, emails } from "@/db/schema";
import { getCurrentUserWithSites } from "@/lib/auth";
import { eq, inArray, desc } from "drizzle-orm";
import { extractDomain, getDomainColor } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUserWithSites();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    let siteList: any[] = [];
    if (user.role === "admin") {
      siteList = await db.select().from(websites).orderBy(desc(websites.createdAt));
    } else {
      if (user.assignedWebsiteIds.length > 0) {
        siteList = await db
          .select()
          .from(websites)
          .where(inArray(websites.id, user.assignedWebsiteIds))
          .orderBy(desc(websites.createdAt));
      }
    }

    // Auto-discover any websites/domains feeding directly from n8n or direct DB submissions
    const distinctUrls = await db
      .select({ sourceUrl: emails.sourceUrl })
      .from(emails)
      .groupBy(emails.sourceUrl);

    const discoveredDomains = new Map<string, { id: string; name: string; url: string; colorTag: string }>();

    for (const item of distinctUrls) {
      if (!item.sourceUrl) continue;
      const domain = extractDomain(item.sourceUrl);
      
      // Check if this domain is already present in registered sites
      const existsInRegistered = siteList.some(
        (s) => extractDomain(s.url).toLowerCase() === domain.toLowerCase() || s.name.toLowerCase() === domain.toLowerCase()
      );

      if (!existsInRegistered && !discoveredDomains.has(domain.toLowerCase())) {
        discoveredDomains.set(domain.toLowerCase(), {
          id: `domain:${domain}`,
          name: domain,
          url: item.sourceUrl.startsWith("http") ? item.sourceUrl : `https://${domain}`,
          colorTag: getDomainColor(domain),
        });
      }
    }

    const mergedWebsites = [...siteList, ...Array.from(discoveredDomains.values())];

    return NextResponse.json({ websites: mergedWebsites });
  } catch (error) {
    console.error("Error fetching websites:", error);
    return NextResponse.json({ error: "Error al obtener sitios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserWithSites();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Permiso denegado: solo admin" }, { status: 403 });
  }

  try {
    const { name, url, colorTag } = await req.json();

    if (!name || !url) {
      return NextResponse.json({ error: "Nombre y URL son requeridos" }, { status: 400 });
    }

    const [newSite] = await db
      .insert(websites)
      .values({
        name: name.trim(),
        url: url.trim(),
        colorTag: colorTag || "#ea580c",
      })
      .returning();

    return NextResponse.json({ success: true, website: newSite });
  } catch (error: any) {
    console.error("Error creating website:", error);
    return NextResponse.json(
      { error: error?.message || "Error al crear el sitio web" },
      { status: 500 }
    );
  }
}
