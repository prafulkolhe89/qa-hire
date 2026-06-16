import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, jobsTable } from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import {
  ListJobsQueryParams,
  GetJobParams,
  UpdateJobStatusParams,
  UpdateJobStatusBody,
} from "@workspace/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

router.get("/jobs", requireAuth, async (req: any, res) => {
  try {
    const parsed = ListJobsQueryParams.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const { status, minScore, source, location, page = 1, limit = 20 } = parsed.data;

    const conditions: any[] = [eq(jobsTable.userId, req.userId)];
    if (status) conditions.push(eq(jobsTable.status, status));
    if (minScore) conditions.push(gte(jobsTable.matchScore, minScore));
    if (source) conditions.push(eq(jobsTable.source, source));

    const whereClause = conditions.length > 1
      ? and(...conditions)
      : conditions[0];

    const offset = (page - 1) * limit;

    const [jobs, countResult] = await Promise.all([
      db.select().from(jobsTable).where(whereClause).limit(limit).offset(offset).orderBy(sql`${jobsTable.matchScore} DESC`),
      db.select({ count: sql<number>`count(*)::int` }).from(jobsTable).where(whereClause),
    ]);

    const filteredJobs = location
      ? jobs.filter(j => j.location.toLowerCase().includes(location.toLowerCase()))
      : jobs;

    return res.json({
      jobs: filteredJobs,
      total: countResult[0]?.count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/jobs/:id", requireAuth, async (req: any, res) => {
  try {
    const parsed = GetJobParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    const [job] = await db
      .select()
      .from(jobsTable)
      .where(and(eq(jobsTable.id, parsed.data.id), eq(jobsTable.userId, req.userId)));
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json(job);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/jobs/:id/status", requireAuth, async (req: any, res) => {
  try {
    const paramsParsed = UpdateJobStatusParams.safeParse({ id: Number(req.params.id) });
    if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });

    const bodyParsed = UpdateJobStatusBody.safeParse(req.body);
    if (!bodyParsed.success) return res.status(400).json({ error: bodyParsed.error.message });

    const [job] = await db
      .update(jobsTable)
      .set({ status: bodyParsed.data.status })
      .where(and(eq(jobsTable.id, paramsParsed.data.id), eq(jobsTable.userId, req.userId)))
      .returning();
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json(job);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
