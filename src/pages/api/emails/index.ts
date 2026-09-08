import type { APIRoute } from "astro";
import { db } from "@/db";
import { emails, websites } from "@/db/schema";
import { getCurrentUserWithSites } from "@/lib/auth";
import { eq, and, desc, sql, ilike, or, gte, lte, inArray } from "drizzle-orm";
import { extractDomain, getDomainColor } from "@/lib/utils";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const user = await getCurrentUserWithSites(request, cookies);
  if (!user) {
    return new Response(
      JSON.stringify({ error: "No autorizado" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const searchParams = url.searchParams;
    const websiteIdParam = searchParams.get("websiteId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    // Role-based scoping
    if (user.role === "operator") {
      if (user.assignedWebsiteIds.length === 0) {
        return new Response(
          JSON.stringify({ emails: [], total: 0, totalPages: 0, page, limit }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      conditions.push(inArray(emails.websiteId, user.assignedWebsiteIds));
    }

    // Filter by website or discovered domain
    if (websiteIdParam && websiteIdParam !== "all") {
      if (websiteIdParam.startsWith("domain:")) {
        const domain = websiteIdParam.replace("domain:", "");
        conditions.push(ilike(emails.sourceUrl, `%${domain}%`));
      } else {
        conditions.push(eq(emails.websiteId, websiteIdParam));
      }
    }

    // Filter by status
    if (status && status !== "all") {
      conditions.push(eq(emails.status, status as any));
    }

    // Search
    if (search && search.trim() !== "") {
      const query = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(emails.senderName, query),
          ilike(emails.senderEmail, query),
          ilike(emails.senderPhone, query),
          ilike(emails.subject, query),
          ilike(emails.message, query),
          ilike(emails.sourceUrl, query)
        )
      );
    }

    // Date range
    if (startDate) {
      conditions.push(gte(emails.createdAt, new Date(startDate)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(emails.createdAt, end));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch records joined with website
    const emailList = await db
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
      .where(whereClause)
      .orderBy(desc(emails.createdAt))
      .limit(limit)
      .offset(offset);

    // Format fallback website info dynamically from sourceUrl if unlinked
    const formattedEmails = emailList.map((e) => {
      const domain = extractDomain(e.sourceUrl);
      return {
        ...e,
        websiteName: e.websiteName || domain,
        websiteColor: e.websiteColor || getDomainColor(domain),
      };
    });

    // Total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emails)
      .where(whereClause);

    const total = countResult ? countResult.count : 0;
    const totalPages = Math.ceil(total / limit);

    return new Response(
      JSON.stringify({
        emails: formattedEmails,
        total,
        totalPages,
        page,
        limit,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error fetching emails:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Error al obtener correos" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
