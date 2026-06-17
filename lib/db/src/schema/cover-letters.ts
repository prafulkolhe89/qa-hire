import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coverLettersTable = pgTable("cover_letters", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  jobId: integer("job_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCoverLetterSchema = createInsertSchema(coverLettersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CoverLetter = typeof coverLettersTable.$inferSelect;
export type InsertCoverLetter = z.infer<typeof insertCoverLetterSchema>;
