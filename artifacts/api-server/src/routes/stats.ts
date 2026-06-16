import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, jobsTable, profilesTable, telegramTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

router.get("/stats/dashboard", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;

    const [countsRow] = await db
      .select({
        totalJobs: sql<number>`count(*)::int`,
        newJobs: sql<number>`count(*) filter (where ${jobsTable.status} = 'new')::int`,
        interestedJobs: sql<number>`count(*) filter (where ${jobsTable.status} = 'interested')::int`,
        appliedJobs: sql<number>`count(*) filter (where ${jobsTable.status} = 'applied')::int`,
        avgMatchScore: sql<number>`coalesce(avg(${jobsTable.matchScore}), 0)`,
        lastSearchAt: sql<string>`max(${jobsTable.createdAt})::text`,
      })
      .from(jobsTable)
      .where(eq(jobsTable.userId, userId));

    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
    const [telegram] = await db.select().from(telegramTable).where(and(eq(telegramTable.userId, userId), eq(telegramTable.isActive, true)));

    const profileComplete = !!(
      profile &&
      profile.skills.length > 0 &&
      profile.preferredLocations.length > 0 &&
      profile.jobTypes.length > 0
    );

    return res.json({
      totalJobs: countsRow?.totalJobs ?? 0,
      newJobs: countsRow?.newJobs ?? 0,
      interestedJobs: countsRow?.interestedJobs ?? 0,
      appliedJobs: countsRow?.appliedJobs ?? 0,
      avgMatchScore: Math.round((countsRow?.avgMatchScore ?? 0) * 10) / 10,
      lastSearchAt: countsRow?.lastSearchAt ?? null,
      profileComplete,
      telegramConnected: !!telegram,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/recent-jobs", requireAuth, async (req: any, res) => {
  try {
    const jobs = await db
      .select()
      .from(jobsTable)
      .where(eq(jobsTable.userId, req.userId))
      .orderBy(sql`${jobsTable.matchScore} DESC, ${jobsTable.createdAt} DESC`)
      .limit(5);
    return res.json(jobs);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/sources", requireAuth, async (req: any, res) => {
  try {
    const rows = await db
      .select({
        source: jobsTable.source,
        count: sql<number>`count(*)::int`,
      })
      .from(jobsTable)
      .where(eq(jobsTable.userId, req.userId))
      .groupBy(jobsTable.source)
      .orderBy(sql`count(*) DESC`);
    return res.json(rows);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/score-distribution", requireAuth, async (req: any, res) => {
  try {
    const jobs = await db
      .select({ matchScore: jobsTable.matchScore })
      .from(jobsTable)
      .where(eq(jobsTable.userId, req.userId));

    const buckets: Record<string, number> = {
      "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0,
    };

    for (const job of jobs) {
      const score = job.matchScore;
      if (score <= 20) buckets["0-20"]++;
      else if (score <= 40) buckets["21-40"]++;
      else if (score <= 60) buckets["41-60"]++;
      else if (score <= 80) buckets["61-80"]++;
      else buckets["81-100"]++;
    }

    const result = Object.entries(buckets).map(([range, count]) => ({ range, count }));
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
