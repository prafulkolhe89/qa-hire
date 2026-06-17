import { pgTable, serial, text, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionPlanEnum = ["free", "pro"] as const;
export type SubscriptionPlan = typeof subscriptionPlanEnum[number];

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
  // Subscription & usage tracking
  subscriptionPlan: text("subscription_plan").notNull().default("free"),
  profileVersion: integer("profile_version").notNull().default(1),
  monthlyProfileEditCount: integer("monthly_profile_edit_count").notNull().default(0),
  dailyJobMatchCount: integer("daily_job_match_count").notNull().default(0),
  dailyCoverLetterCount: integer("daily_cover_letter_count").notNull().default(0),
  lastProfileChangedAt: timestamp("last_profile_changed_at"),
  searchQuotaUsed: integer("search_quota_used").notNull().default(0),
  quotaResetDate: date("quota_reset_date"),
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
