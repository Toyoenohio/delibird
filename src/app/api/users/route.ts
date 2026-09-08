import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, userWebsites } from "@/db/schema";
import { getCurrentUserWithSites, hashPassword } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const currentUser = await getCurrentUserWithSites();
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Permiso denegado: solo admin" }, { status: 403 });
  }

  try {
    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // For each user, attach assigned website IDs
    const usersWithSites = await Promise.all(
      userList.map(async (u) => {
        const assignments = await db
          .select({ websiteId: userWebsites.websiteId })
          .from(userWebsites)
          .where(eq(userWebsites.userId, u.id));
        return {
          ...u,
          assignedWebsiteIds: assignments.map((a) => a.websiteId),
        };
      })
    );

    return NextResponse.json({ users: usersWithSites });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUserWithSites();
  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Permiso denegado: solo admin" }, { status: 403 });
  }

  try {
    const { name, email, password, role, assignedWebsiteIds } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, correo y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role || "operator",
      })
      .returning();

    // If website IDs are provided and user is operator, insert assignments
    if (Array.isArray(assignedWebsiteIds) && assignedWebsiteIds.length > 0) {
      await db.insert(userWebsites).values(
        assignedWebsiteIds.map((websiteId: string) => ({
          userId: newUser.id,
          websiteId,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        assignedWebsiteIds: assignedWebsiteIds || [],
      },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "El correo electrónico ya se encuentra registrado" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}
