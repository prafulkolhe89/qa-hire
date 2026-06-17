import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, keywordsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import * as z from "zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

const AddKeywordBody = z.object({
  keyword: z.string().min(1).max(100),
  category: z.string().default("other"),
  source: z.enum(["resume_generated", "user_added", "user_edited", "system_suggested"]).default("user_added"),
});

const UpdateKeywordBody = z.object({
  keyword: z.string().min(1).max(100).optional(),
  category: z.string().optional(),
});

router.get("/keywords", requireAuth, async (req: any, res) => {
  try {
    const keywords = await db
      .select()
      .from(keywordsTable)
      .where(eq(keywordsTable.userId, req.userId))
      .orderBy(keywordsTable.category, keywordsTable.keyword);
    return res.json(keywords);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/keywords", requireAuth, async (req: any, res) => {
  try {
    const parsed = AddKeywordBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const [kw] = await db
      .insert(keywordsTable)
      .values({ ...parsed.data, userId: req.userId })
      .returning();
    return res.status(201).json(kw);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/keywords/:id", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const parsed = UpdateKeywordBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const [kw] = await db
      .update(keywordsTable)
      .set({ ...parsed.data, source: "user_edited", updatedAt: new Date() })
      .where(and(eq(keywordsTable.id, id), eq(keywordsTable.userId, req.userId)))
      .returning();
    if (!kw) return res.status(404).json({ error: "Keyword not found" });
    return res.json(kw);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/keywords/:id", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    await db
      .delete(keywordsTable)
      .where(and(eq(keywordsTable.id, id), eq(keywordsTable.userId, req.userId)));
    return res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
