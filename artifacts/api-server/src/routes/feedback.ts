import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, feedbackTable } from "@workspace/db";
import { SubmitFeedbackBody } from "@workspace/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

router.post("/feedback", requireAuth, async (req: any, res) => {
  try {
    const parsed = SubmitFeedbackBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const [feedback] = await db
      .insert(feedbackTable)
      .values({ ...parsed.data, userId: req.userId })
      .returning();
    return res.status(201).json(feedback);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
