import type { APIRoute } from "astro";
import { db } from "@/db";
import { websites, emails } from "@/db/schema";
import { getCurrentUserWithSites } from "@/lib/auth";
import { inArray, desc } from "drizzle-orm";
import { extractDomain, getDomainColor } from "@/lib/utils";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  const user = await getCurrentUserWithSites(request, cookies);
  if (!user) {
    return new Response(
      JSON.stringify({ error: "No autorizado" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
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

    return new Response(
      JSON.stringify({ websites: mergedWebsites }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error fetching websites:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error al obtener sitios" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getCurrentUserWithSites(request, cookies);
  if (!user || user.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Permiso denegado: solo admin" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { name, url, colorTag } = await request.json();

    if (!name || !url) {
      return new Response(
        JSON.stringify({ error: "Nombre y URL son requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const [newSite] = await db
      .insert(websites)
      .values({
        name: name.trim(),
        url: url.trim(),
        colorTag: colorTag || "#ea580c",
      })
      .returning();

    return new Response(
      JSON.stringify({ success: true, website: newSite }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error creating website:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error al crear el sitio web" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
