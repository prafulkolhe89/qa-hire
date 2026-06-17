import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recruiterMessagesTable = pgTable("recruiter_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  jobId: integer("job_id").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRecruiterMessageSchema = createInsertSchema(recruiterMessagesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type RecruiterMessage = typeof recruiterMessagesTable.$inferSelect;
export type InsertRecruiterMessage = z.infer<typeof insertRecruiterMessageSchema>;
