import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LIMITS } from "../lib/quota";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

router.get("/subscription", requireAuth, async (req: any, res) => {
  try {
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, req.userId));

    if (!profile) {
      return res.json({
        plan: "free",
        profileVersion: 1,
        usage: {
          monthlyProfileEdits: { used: 0, limit: LIMITS.free.monthlyProfileEdits },
          dailyJobMatches: { used: 0, limit: LIMITS.free.dailyJobMatches },
          dailyCoverLetters: { used: 0, limit: LIMITS.free.dailyCoverLetters },
        },
        quotaResetDate: null,
      });
    }

    const plan = (profile.subscriptionPlan as "free" | "pro") ?? "free";
    const limits = LIMITS[plan];

    return res.json({
      plan,
      profileVersion: profile.profileVersion,
      usage: {
        monthlyProfileEdits: {
          used: profile.monthlyProfileEditCount,
          limit: limits.monthlyProfileEdits === Infinity ? null : limits.monthlyProfileEdits,
        },
        dailyJobMatches: {
          used: profile.dailyJobMatchCount,
          limit: limits.dailyJobMatches === Infinity ? null : limits.dailyJobMatches,
        },
        dailyCoverLetters: {
          used: profile.dailyCoverLetterCount,
          limit: limits.dailyCoverLetters === Infinity ? null : limits.dailyCoverLetters,
        },
      },
      quotaResetDate: profile.quotaResetDate,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
