import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profileVersionsTable = pgTable("profile_versions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProfileVersionSchema = createInsertSchema(profileVersionsTable).omit({
  id: true,
  createdAt: true,
});

export type ProfileVersion = typeof profileVersionsTable.$inferSelect;
export type InsertProfileVersion = z.infer<typeof insertProfileVersionSchema>;
