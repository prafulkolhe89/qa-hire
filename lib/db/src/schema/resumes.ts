import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resumeStatusEnum = ["pending", "processing", "ready", "failed"] as const;
export type ResumeStatus = typeof resumeStatusEnum[number];

export const resumesTable = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  filePath: text("file_path").notNull(),
  extractedText: text("extracted_text"),
  status: text("status").notNull().default("pending"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertResumeSchema = createInsertSchema(resumesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Resume = typeof resumesTable.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
