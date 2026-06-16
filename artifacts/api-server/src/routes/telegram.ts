import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, telegramTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ConnectTelegramBody } from "@workspace/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

router.get("/telegram/status", requireAuth, async (req: any, res) => {
  try {
    const [conn] = await db.select().from(telegramTable).where(eq(telegramTable.userId, req.userId));
    if (!conn || !conn.isActive) {
      return res.json({ connected: false, chatId: null, username: null });
    }
    return res.json({ connected: true, chatId: conn.chatId, username: conn.username });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/telegram/connect", requireAuth, async (req: any, res) => {
  try {
    const parsed = ConnectTelegramBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const existing = await db.select().from(telegramTable).where(eq(telegramTable.userId, req.userId));
    let conn;
    if (existing.length > 0) {
      const [updated] = await db
        .update(telegramTable)
        .set({ chatId: parsed.data.chatId, username: parsed.data.username, isActive: true, updatedAt: new Date() })
        .where(eq(telegramTable.userId, req.userId))
        .returning();
      conn = updated;
    } else {
      const [created] = await db
        .insert(telegramTable)
        .values({ userId: req.userId, chatId: parsed.data.chatId, username: parsed.data.username })
        .returning();
      conn = created;
    }
    return res.json({ connected: true, chatId: conn.chatId, username: conn.username });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/telegram/disconnect", requireAuth, async (req: any, res) => {
  try {
    await db
      .update(telegramTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(telegramTable.userId, req.userId));
    return res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/telegram/test", requireAuth, async (req: any, res) => {
  try {
    const [conn] = await db.select().from(telegramTable).where(eq(telegramTable.userId, req.userId));
    if (!conn || !conn.isActive) {
      return res.status(400).json({ error: "Telegram not connected" });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(503).json({ error: "Telegram bot not configured yet — add TELEGRAM_BOT_TOKEN to secrets" });
    }

    const text = `👋 QAHire test message!\n\nYour Telegram is connected and ready to receive daily QA job alerts.`;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: conn.chatId, text }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to send Telegram message — check your chat ID" });
    }
    return res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
