import { db, profilesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export const LIMITS = {
  free: {
    monthlyProfileEdits: 5,
    dailyJobMatches: 15,
    dailyCoverLetters: 3,
  },
  pro: {
    monthlyProfileEdits: Infinity,
    dailyJobMatches: Infinity,
    dailyCoverLetters: Infinity,
  },
} as const;

export type QuotaType = "profileEdit" | "jobMatch" | "coverLetter";

async function ensureQuotaReset(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const [profile] = await db
    .select({ quotaResetDate: profilesTable.quotaResetDate })
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId));

  if (!profile) return;
  if (!profile.quotaResetDate || profile.quotaResetDate < today) {
    await db
      .update(profilesTable)
      .set({ dailyJobMatchCount: 0, dailyCoverLetterCount: 0, quotaResetDate: today })
      .where(eq(profilesTable.userId, userId));
  }
}

export async function checkQuota(
  userId: string,
  type: QuotaType,
): Promise<{ allowed: boolean; message: string }> {
  await ensureQuotaReset(userId);

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId));

  if (!profile) return { allowed: false, message: "Profile not found" };

  const plan = (profile.subscriptionPlan as "free" | "pro") ?? "free";
  const limits = LIMITS[plan];

  if (type === "profileEdit" && profile.monthlyProfileEditCount >= limits.monthlyProfileEdits) {
    return {
      allowed: false,
      message: `You've used all ${limits.monthlyProfileEdits} profile edits for this month. Upgrade to Pro for unlimited edits.`,
    };
  }
  if (type === "jobMatch" && profile.dailyJobMatchCount >= limits.dailyJobMatches) {
    return {
      allowed: false,
      message: `You've reached your daily limit of ${limits.dailyJobMatches} job matches. Come back tomorrow or upgrade to Pro.`,
    };
  }
  if (type === "coverLetter" && profile.dailyCoverLetterCount >= limits.dailyCoverLetters) {
    return {
      allowed: false,
      message: `You've used all ${limits.dailyCoverLetters} cover letter generations for today. Upgrade to Pro for more.`,
    };
  }

  return { allowed: true, message: "" };
}

export async function incrementQuota(userId: string, type: QuotaType) {
  if (type === "profileEdit") {
    await db
      .update(profilesTable)
      .set({ monthlyProfileEditCount: sql`${profilesTable.monthlyProfileEditCount} + 1` })
      .where(eq(profilesTable.userId, userId));
  } else if (type === "jobMatch") {
    await db
      .update(profilesTable)
      .set({ dailyJobMatchCount: sql`${profilesTable.dailyJobMatchCount} + 1` })
      .where(eq(profilesTable.userId, userId));
  } else if (type === "coverLetter") {
    await db
      .update(profilesTable)
      .set({ dailyCoverLetterCount: sql`${profilesTable.dailyCoverLetterCount} + 1` })
      .where(eq(profilesTable.userId, userId));
  }
}
