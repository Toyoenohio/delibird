import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emails, websites } from "@/db/schema";
import { getCurrentUserWithSites } from "@/lib/auth";
import { and, desc, eq, ilike, inArray, gte, lte, or, sql } from "drizzle-orm";
import { extractDomain, getDomainColor } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getCurrentUserWithSites();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const websiteId = searchParams.get("websiteId");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50")));
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    // Access control: If operator, restrict to their assigned websites
    if (user.role === "operator") {
      if (user.assignedWebsiteIds.length === 0) {
        return NextResponse.json({
          emails: [],
          total: 0,
          page,
          totalPages: 0,
        });
      }

      if (websiteId && websiteId !== "all") {
        if (!user.assignedWebsiteIds.includes(websiteId)) {
          return NextResponse.json({ error: "No tienes permiso para este sitio web" }, { status: 403 });
        }
        conditions.push(eq(emails.websiteId, websiteId));
      } else {
        conditions.push(inArray(emails.websiteId, user.assignedWebsiteIds));
      }
    } else if (websiteId && websiteId !== "all") {
      if (websiteId.startsWith("domain:")) {
        const domain = websiteId.replace("domain:", "");
        conditions.push(ilike(emails.sourceUrl, `%${domain}%`));
      } else {
        conditions.push(eq(emails.websiteId, websiteId));
      }
    }

    // Filter by status
    if (status && status !== "all") {
      conditions.push(eq(emails.status, status as any));
    }

    // Filter by search query (name, email, phone, subject, message, sourceUrl)
    if (search && search.trim().length > 0) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(emails.senderName, q),
          ilike(emails.senderEmail, q),
          ilike(emails.senderPhone, q),
          ilike(emails.subject, q),
          ilike(emails.message, q),
          ilike(emails.sourceUrl, q)
        )
      );
    }

    // Filter by Date Range
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        conditions.push(gte(emails.createdAt, start));
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(emails.createdAt, end));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emails)
      .where(whereClause);

    const total = countResult?.count || 0;

    // Fetch emails joined with website info
    const rawEmailList = await db
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
      .where(whereClause)
      .orderBy(desc(emails.createdAt))
      .limit(limit)
      .offset(offset);

    // Format websiteName and websiteColor dynamically if not linked to a registered website
    const emailList = rawEmailList.map((e) => {
      const domain = extractDomain(e.sourceUrl);
      return {
        ...e,
        websiteName: e.websiteName || domain,
        websiteColor: e.websiteColor || getDomainColor(domain),
      };
    });

    return NextResponse.json({
      emails: emailList,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json({ error: "Error al obtener correos" }, { status: 500 });
  }
}
