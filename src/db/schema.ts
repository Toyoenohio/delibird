import { pgTable, text, timestamp, uuid, pgEnum, primaryKey, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("user_role", ["admin", "operator"]);
export const emailStatusEnum = pgEnum("email_status", [
  "nuevo",
  "en_proceso",
  "contactado",
  "cerrado",
  "spam",
]);

// 1. Users Table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").default("operator").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Websites Table
export const websites = pgTable("websites", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  colorTag: text("color_tag").default("#ea580c").notNull(), // Hex color for UI badges
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. User - Website Many-to-Many Assignment
export const userWebsites = pgTable(
  "user_websites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    websiteId: uuid("website_id")
      .notNull()
      .references(() => websites.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.websiteId] }),
  ]
);

// 4. Emails / Form Submissions Table
export const emails = pgTable("emails", {
  id: uuid("id").defaultRandom().primaryKey(),
  websiteId: uuid("website_id").references(() => websites.id, { onDelete: "set null" }),
  sourceUrl: text("source_url").notNull(), // Web/URL exact from where it was submitted
  senderName: text("sender_name").notNull(), // Nombre y apellido
  senderEmail: text("sender_email").notNull(), // Correo del remitente
  senderPhone: text("sender_phone"), // Teléfono
  subject: text("subject").notNull(), // Asunto
  message: text("message").notNull(), // Mensaje
  status: emailStatusEnum("status").default("nuevo").notNull(),
  extraFields: jsonb("extra_fields").$type<Record<string, any>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. Internal Notes per Email
export const emailNotes = pgTable("email_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  emailId: uuid("email_id")
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Status History / Audit Trail
export const emailStatusHistory = pgTable("email_status_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  emailId: uuid("email_id")
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  previousStatus: text("previous_status").notNull(),
  newStatus: text("new_status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userWebsites: many(userWebsites),
  notes: many(emailNotes),
}));

export const websitesRelations = relations(websites, ({ many }) => ({
  userWebsites: many(userWebsites),
  emails: many(emails),
}));

export const userWebsitesRelations = relations(userWebsites, ({ one }) => ({
  user: one(users, {
    fields: [userWebsites.userId],
    references: [users.id],
  }),
  website: one(websites, {
    fields: [userWebsites.websiteId],
    references: [websites.id],
  }),
}));

export const emailsRelations = relations(emails, ({ one, many }) => ({
  website: one(websites, {
    fields: [emails.websiteId],
    references: [websites.id],
  }),
  notes: many(emailNotes),
  statusHistory: many(emailStatusHistory),
}));

export const emailNotesRelations = relations(emailNotes, ({ one }) => ({
  email: one(emails, {
    fields: [emailNotes.emailId],
    references: [emails.id],
  }),
  user: one(users, {
    fields: [emailNotes.userId],
    references: [users.id],
  }),
}));

export const emailStatusHistoryRelations = relations(emailStatusHistory, ({ one }) => ({
  email: one(emails, {
    fields: [emailStatusHistory.emailId],
    references: [emails.id],
  }),
  user: one(users, {
    fields: [emailStatusHistory.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Website = typeof websites.$inferSelect;
export type NewWebsite = typeof websites.$inferInsert;
export type EmailRecord = typeof emails.$inferSelect;
export type NewEmailRecord = typeof emails.$inferInsert;
export type EmailNote = typeof emailNotes.$inferSelect;
export type EmailStatus = "nuevo" | "en_proceso" | "contactado" | "cerrado" | "spam";
