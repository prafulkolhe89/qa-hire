import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, coverLettersTable, recruiterMessagesTable, applyGuidanceTable, profilesTable, resumesTable, jobsTable, keywordsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import * as z from "zod";
import { chatComplete, parseJsonResponse } from "../lib/openai";
import { prompts } from "../lib/prompts";
import { checkQuota, incrementQuota } from "../lib/quota";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

const UpdateCoverLetterBody = z.object({ content: z.string().min(1) });

// ─── Cover Letter ─────────────────────────────────────────────────────────────

router.get("/jobs/:id/cover-letter", requireAuth, async (req: any, res) => {
  try {
    const jobId = Number(req.params.id);
    const [cl] = await db
      .select()
      .from(coverLettersTable)
      .where(and(eq(coverLettersTable.jobId, jobId), eq(coverLettersTable.userId, req.userId)));
    if (!cl) return res.status(404).json({ error: "No cover letter found for this job" });
    return res.json(cl);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/jobs/:id/cover-letter", requireAuth, async (req: any, res) => {
  try {
    const jobId = Number(req.params.id);

    const quota = await checkQuota(req.userId, "coverLetter");
    if (!quota.allowed) return res.status(429).json({ error: quota.message });

    const [[job], [profile], [resume], keywords] = await Promise.all([
      db.select().from(jobsTable).where(and(eq(jobsTable.id, jobId), eq(jobsTable.userId, req.userId))),
      db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId)),
      db.select().from(resumesTable).where(eq(resumesTable.userId, req.userId)),
      db.select().from(keywordsTable).where(eq(keywordsTable.userId, req.userId)),
    ]);

    if (!job) return res.status(404).json({ error: "Job not found" });
    if (!profile) return res.status(400).json({ error: "Profile not found. Please create your profile first." });

    const { system, user } = prompts.coverLetter(
      "QA Professional",
      keywords.find((k) => k.category === "primary_role")?.keyword ?? "QA Engineer",
      profile.skills,
      resume?.extractedText ?? "",
      job.title,
      job.company,
      job.description ?? job.matchReason,
    );

    const content = await chatComplete(system, user);

    const existing = await db
      .select()
      .from(coverLettersTable)
      .where(and(eq(coverLettersTable.jobId, jobId), eq(coverLettersTable.userId, req.userId)));

    const [cl] = existing.length > 0
      ? await db
          .update(coverLettersTable)
          .set({ content, updatedAt: new Date() })
          .where(and(eq(coverLettersTable.jobId, jobId), eq(coverLettersTable.userId, req.userId)))
          .returning()
      : await db
          .insert(coverLettersTable)
          .values({ userId: req.userId, jobId, content })
          .returning();

    await incrementQuota(req.userId, "coverLetter");
    return res.status(201).json(cl);
  } catch (err) {
    req.log.error(err);
    if ((err as Error).message?.includes("OPENAI_API_KEY")) {
      return res.status(503).json({ error: "AI service not configured. Add OPENAI_API_KEY to secrets." });
    }
    return res.status(500).json({ error: "Cover letter generation failed" });
  }
});

router.patch("/jobs/:id/cover-letter", requireAuth, async (req: any, res) => {
  try {
    const jobId = Number(req.params.id);
    const parsed = UpdateCoverLetterBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const [cl] = await db
      .update(coverLettersTable)
      .set({ content: parsed.data.content, updatedAt: new Date() })
      .where(and(eq(coverLettersTable.jobId, jobId), eq(coverLettersTable.userId, req.userId)))
      .returning();
    if (!cl) return res.status(404).json({ error: "No cover letter found for this job" });
    return res.json(cl);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Recruiter Message ────────────────────────────────────────────────────────

router.get("/jobs/:id/recruiter-message", requireAuth, async (req: any, res) => {
  try {
    const jobId = Number(req.params.id);
    const [msg] = await db
      .select()
      .from(recruiterMessagesTable)
      .where(and(eq(recruiterMessagesTable.jobId, jobId), eq(recruiterMessagesTable.userId, req.userId)));
    if (!msg) return res.status(404).json({ error: "No recruiter message found for this job" });
    return res.json(msg);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/jobs/:id/recruiter-message", requireAuth, async (req: any, res) => {
  try {
    const jobId = Number(req.params.id);

    const [[job], [profile], keywords] = await Promise.all([
      db.select().from(jobsTable).where(and(eq(jobsTable.id, jobId), eq(jobsTable.userId, req.userId))),
      db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId)),
      db.select().from(keywordsTable).where(eq(keywordsTable.userId, req.userId)),
    ]);

    if (!job) return res.status(404).json({ error: "Job not found" });
    if (!profile) return res.status(400).json({ error: "Profile not found" });

    const { system, user } = prompts.recruiterMessage(
      "QA Professional",
      keywords.find((k) => k.category === "primary_role")?.keyword ?? "QA Engineer",
      profile.skills,
      job.title,
      job.company,
      job.matchedSkills,
    );

    const message = await chatComplete(system, user);

    const existing = await db
      .select()
      .from(recruiterMessagesTable)
      .where(and(eq(recruiterMessagesTable.jobId, jobId), eq(recruiterMessagesTable.userId, req.userId)));

    const [msg] = existing.length > 0
      ? await db
          .update(recruiterMessagesTable)
          .set({ message, updatedAt: new Date() })
          .where(and(eq(recruiterMessagesTable.jobId, jobId), eq(recruiterMessagesTable.userId, req.userId)))
          .returning()
      : await db
          .insert(recruiterMessagesTable)
          .values({ userId: req.userId, jobId, message })
          .returning();

    return res.status(201).json(msg);
  } catch (err) {
    req.log.error(err);
    if ((err as Error).message?.includes("OPENAI_API_KEY")) {
      return res.status(503).json({ error: "AI service not configured. Add OPENAI_API_KEY to secrets." });
    }
    return res.status(500).json({ error: "Message generation failed" });
  }
});

// ─── Apply Guidance ───────────────────────────────────────────────────────────

router.get("/jobs/:id/apply-guidance", requireAuth, async (req: any, res) => {
  try {
    const jobId = Number(req.params.id);
    const [guidance] = await db
      .select()
      .from(applyGuidanceTable)
      .where(and(eq(applyGuidanceTable.jobId, jobId), eq(applyGuidanceTable.userId, req.userId)));
    if (!guidance) return res.status(404).json({ error: "No apply guidance found for this job" });
    return res.json(guidance);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/jobs/:id/apply-guidance", requireAuth, async (req: any, res) => {
  try {
    const jobId = Number(req.params.id);

    const [job] = await db
      .select()
      .from(jobsTable)
      .where(and(eq(jobsTable.id, jobId), eq(jobsTable.userId, req.userId)));
    if (!job) return res.status(404).json({ error: "Job not found" });

    const { system, user } = prompts.applyGuidance(
      job.title,
      job.company,
      job.source,
      job.applyUrl,
      job.description ?? "",
    );

    const raw = await chatComplete(system, user);
    type GuidanceResponse = {
      applyMethod?: string;
      actionSteps?: string;
      useResume?: boolean;
      useCoverLetter?: boolean;
      recruiterNote?: string;
    };
    const parsed = parseJsonResponse<GuidanceResponse>(raw);

    const existing = await db
      .select()
      .from(applyGuidanceTable)
      .where(and(eq(applyGuidanceTable.jobId, jobId), eq(applyGuidanceTable.userId, req.userId)));

    const values = {
      userId: req.userId,
      jobId,
      applyMethod: parsed.applyMethod ?? "direct",
      directApplyUrl: job.applyUrl || null,
      sourceApplyUrl: job.applyUrl || null,
      actionSteps: parsed.actionSteps ?? "",
      useResume: parsed.useResume ?? true,
      useCoverLetter: parsed.useCoverLetter ?? false,
      recruiterNote: parsed.recruiterNote ?? null,
    };

    const [guidance] = existing.length > 0
      ? await db
          .update(applyGuidanceTable)
          .set({ ...values, updatedAt: new Date() })
          .where(and(eq(applyGuidanceTable.jobId, jobId), eq(applyGuidanceTable.userId, req.userId)))
          .returning()
      : await db.insert(applyGuidanceTable).values(values).returning();

    return res.status(201).json(guidance);
  } catch (err) {
    req.log.error(err);
    if ((err as Error).message?.includes("OPENAI_API_KEY")) {
      return res.status(503).json({ error: "AI service not configured. Add OPENAI_API_KEY to secrets." });
    }
    return res.status(500).json({ error: "Apply guidance generation failed" });
  }
});

export default router;
