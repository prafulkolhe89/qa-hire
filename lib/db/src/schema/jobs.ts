import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobStatusEnum = ["new", "interested", "applied", "not_relevant", "duplicate"] as const;
export type JobStatus = typeof jobStatusEnum[number];

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull().default(""),
  source: text("source").notNull(),
  applyUrl: text("apply_url").notNull().default(""),
  postedAt: text("posted_at"),
  matchScore: integer("match_score").notNull().default(0),
  matchReason: text("match_reason").notNull().default(""),
  status: text("status").notNull().default("new"),
  skills: text("skills").array().notNull().default([]),
  experienceRequired: text("experience_required"),
  salaryRange: text("salary_range"),
  jobType: text("job_type"),
  description: text("description"),
  externalId: text("external_id"),
  matchedSkills: text("matched_skills").array().notNull().default([]),
  missingSkills: text("missing_skills").array().notNull().default([]),
  profileVersionId: integer("profile_version_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({
  id: true,
  createdAt: true,
});

export type Job = typeof jobsTable.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
