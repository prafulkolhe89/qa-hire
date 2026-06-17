import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, profilesTable, profileVersionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreateProfileBody,
  UpdateProfileBody,
} from "@workspace/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

/** Fields that count as a "criteria change" and trigger a version increment */
const MATCHING_FIELDS = new Set([
  "skills",
  "yearsOfExperience",
  "preferredLocations",
  "jobTypes",
  "includeKeywords",
  "excludeKeywords",
  "expectedSalaryMin",
  "expectedSalaryMax",
]);

function hasCriteriaChanged(existing: Record<string, unknown>, incoming: Record<string, unknown>): boolean {
  for (const field of MATCHING_FIELDS) {
    if (!(field in incoming)) continue;
    const oldVal = JSON.stringify(existing[field]);
    const newVal = JSON.stringify(incoming[field]);
    if (oldVal !== newVal) return true;
  }
  return false;
}

router.get("/profile", requireAuth, async (req: any, res) => {
  try {
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, req.userId));
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    return res.json(profile);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/profile", requireAuth, async (req: any, res) => {
  try {
    const parsed = CreateProfileBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const existing = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.userId));
    if (existing.length > 0) {
      return res.status(409).json({ error: "Profile already exists, use PATCH to update" });
    }

    const [profile] = await db
      .insert(profilesTable)
      .values({ ...parsed.data, userId: req.userId, profileVersion: 1 })
      .returning();

    // Create initial version snapshot
    await db.insert(profileVersionsTable).values({
      userId: req.userId,
      version: 1,
      snapshot: parsed.data,
      isActive: true,
    });

    return res.status(201).json(profile);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/profile", requireAuth, async (req: any, res) => {
  try {
    const parsed = UpdateProfileBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const [existing] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, req.userId));
    if (!existing) return res.status(404).json({ error: "Profile not found" });

    const criteriaChanged = hasCriteriaChanged(existing as unknown as Record<string, unknown>, parsed.data as Record<string, unknown>);

    let newVersion = existing.profileVersion;
    const extraUpdates: Record<string, unknown> = {};

    if (criteriaChanged) {
      newVersion = (existing.profileVersion ?? 1) + 1;
      extraUpdates.profileVersion = newVersion;
      extraUpdates.lastProfileChangedAt = new Date();
      extraUpdates.monthlyProfileEditCount = sql`${profilesTable.monthlyProfileEditCount} + 1`;

      // Deactivate old versions, save new snapshot
      await db
        .update(profileVersionsTable)
        .set({ isActive: false })
        .where(eq(profileVersionsTable.userId, req.userId));

      await db.insert(profileVersionsTable).values({
        userId: req.userId,
        version: newVersion,
        snapshot: { ...existing, ...parsed.data },
        isActive: true,
      });
    }

    const [profile] = await db
      .update(profilesTable)
      .set({ ...parsed.data, ...extraUpdates, updatedAt: new Date() })
      .where(eq(profilesTable.userId, req.userId))
      .returning();

    return res.json({ ...profile, criteriaChanged });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
