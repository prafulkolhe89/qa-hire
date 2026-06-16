import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  skills: text("skills").array().notNull().default([]),
  yearsOfExperience: integer("years_of_experience").notNull().default(0),
  preferredLocations: text("preferred_locations").array().notNull().default([]),
  noticePeriod: text("notice_period").notNull().default(""),
  jobTypes: text("job_types").array().notNull().default([]),
  includeKeywords: text("include_keywords").array().notNull().default([]),
  excludeKeywords: text("exclude_keywords").array().notNull().default([]),
  expectedSalaryMin: integer("expected_salary_min"),
  expectedSalaryMax: integer("expected_salary_max"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Profile = typeof profilesTable.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
