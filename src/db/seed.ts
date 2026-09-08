import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!dbUrl) {
    console.error("❌ ERROR: DATABASE_URL is not defined in .env or .env.local");
    process.exit(1);
  }

  console.log("🌱 Starting database seeding...");
  const sql = neon(dbUrl);
  const db = drizzle(sql, { schema });

  // 1. Create default Admin User if not exists
  const adminEmail = process.env.ADMIN_EMAIL || "admin@ejemplo.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword123!";
  const adminName = process.env.ADMIN_NAME || "Administrador Global";

  const existingAdmin = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail))
    .limit(1);

  let adminUser = existingAdmin[0];

  if (!adminUser) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const [inserted] = await db
      .insert(schema.users)
      .values({
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: "admin",
      })
      .returning();
    adminUser = inserted;
    console.log(`✅ Admin user created: ${adminEmail} (password: ${adminPassword})`);
  } else {
    console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
  }

  // 2. Create sample demo websites if none exist
  const existingWebsites = await db.select().from(schema.websites).limit(1);
  if (existingWebsites.length === 0) {
    console.log("🌐 Creating initial demo websites...");
    const [web1] = await db
      .insert(schema.websites)
      .values({
        name: "E-Commerce Tienda Principal",
        url: "https://tienda.ejemplo.com",
        colorTag: "#ea580c", // Orange
      })
      .returning();

    const [web2] = await db
      .insert(schema.websites)
      .values({
        name: "Servicios Legales & Consultoría",
        url: "https://abogados.ejemplo.com",
        colorTag: "#8b5cf6", // Purple
      })
      .returning();

    const [web3] = await db
      .insert(schema.websites)
      .values({
        name: "Inmobiliaria & Bienes Raíces",
        url: "https://inmuebles.ejemplo.com",
        colorTag: "#10b981", // Emerald
      })
      .returning();

    // Create a demo Operator User
    const operatorPassword = await bcrypt.hash("Operador123!", 10);
    const [operatorUser] = await db
      .insert(schema.users)
      .values({
        name: "Carlos Operador",
        email: "operador@ejemplo.com",
        passwordHash: operatorPassword,
        role: "operator",
      })
      .returning();

    // Assign operator to web1 and web2 only
    await db.insert(schema.userWebsites).values([
      { userId: operatorUser.id, websiteId: web1.id },
      { userId: operatorUser.id, websiteId: web2.id },
    ]);
    console.log(`✅ Operator user created: operador@ejemplo.com (assigned to Tienda and Consultoría)`);

    // Insert initial sample emails
    await db.insert(schema.emails).values([
      {
        websiteId: web1.id,
        sourceUrl: "https://tienda.ejemplo.com/contacto",
        senderName: "María González",
        senderEmail: "maria.gonzalez@gmail.com",
        senderPhone: "+34 612 345 678",
        subject: "Consulta sobre envíos internacionales",
        message: "Hola, quisiera saber si realizan envíos a México y cuál es el costo aproximado.",
        status: "nuevo",
      },
      {
        websiteId: web1.id,
        sourceUrl: "https://tienda.ejemplo.com/producto/laptop-pro",
        senderName: "Juan Pérez",
        senderEmail: "juan.perez@hotmail.com",
        senderPhone: "+52 55 1234 5678",
        subject: "Disponibilidad de stock",
        message: "Buenas tardes, ¿tienen stock disponible del modelo de 32GB RAM en color gris?",
        status: "en_proceso",
      },
      {
        websiteId: web2.id,
        sourceUrl: "https://abogados.ejemplo.com/asesoria",
        senderName: "Dra. Lucía Méndez",
        senderEmail: "lucia.mendez@empresa.es",
        senderPhone: "+34 699 888 777",
        subject: "Cotización para asesoría laboral corporativa",
        message: "Requerimos revisión de contratos colectivos para una plantilla de 50 trabajadores.",
        status: "contactado",
      },
    ]);
    console.log("✅ Sample emails and submissions inserted successfully.");
  }

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error seeding database:", err);
  process.exit(1);
});
