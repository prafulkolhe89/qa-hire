import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applyGuidanceTable = pgTable("apply_guidance", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  jobId: integer("job_id").notNull(),
  applyMethod: text("apply_method").notNull().default("direct"),
  directApplyUrl: text("direct_apply_url"),
  sourceApplyUrl: text("source_apply_url"),
  actionSteps: text("action_steps").notNull().default(""),
  useResume: boolean("use_resume").notNull().default(true),
  useCoverLetter: boolean("use_cover_letter").notNull().default(false),
  recruiterNote: text("recruiter_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertApplyGuidanceSchema = createInsertSchema(applyGuidanceTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ApplyGuidance = typeof applyGuidanceTable.$inferSelect;
export type InsertApplyGuidance = z.infer<typeof insertApplyGuidanceSchema>;
