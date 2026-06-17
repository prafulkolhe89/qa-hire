import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const keywordSourceEnum = [
  "resume_generated",
  "user_added",
  "user_edited",
  "system_suggested",
] as const;
export type KeywordSource = typeof keywordSourceEnum[number];

export const keywordCategoryEnum = [
  "primary_role",
  "qa_skill",
  "automation_tool",
  "programming_language",
  "testing_type",
  "framework",
  "domain",
  "certification",
  "cloud_devops",
  "other",
] as const;
export type KeywordCategory = typeof keywordCategoryEnum[number];

export const keywordsTable = pgTable("keywords", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  keyword: text("keyword").notNull(),
  category: text("category").notNull().default("other"),
  source: text("source").notNull().default("user_added"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertKeywordSchema = createInsertSchema(keywordsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Keyword = typeof keywordsTable.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
