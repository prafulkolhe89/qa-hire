import { Router } from "express";
import { getAuth } from "@clerk/express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { db, resumesTable, keywordsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { chatComplete, parseJsonResponse } from "../lib/openai";
import { prompts } from "../lib/prompts";

const router = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/tmp/qahire-uploads";

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error("Only PDF and DOCX files are allowed"));
    }
    cb(null, true);
  },
});

const requireAuth = (req: any, res: any, next: any) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

async function extractText(filePath: string, mimeType: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  try {
    if (ext === ".pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const buffer = await fs.readFile(filePath);
      const result = await pdfParse(buffer);
      return result.text;
    } else if (ext === ".docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
  } catch (err) {
    throw new Error(`Text extraction failed: ${(err as Error).message}`);
  }
  return "";
}

router.get("/resume", requireAuth, async (req: any, res) => {
  try {
    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, req.userId));
    if (!resume || !resume.isActive) {
      return res.status(404).json({ error: "No resume found" });
    }
    return res.json({
      id: resume.id,
      fileName: resume.fileName,
      fileType: resume.fileType,
      status: resume.status,
      hasText: !!resume.extractedText,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/resume/upload",
  requireAuth,
  (req: any, res: any, next: any) => upload.single("resume")(req, res, next),
  async (req: any, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const existing = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, req.userId));

    if (existing.length > 0 && existing[0].filePath && existing[0].filePath !== file.path) {
      await fs.unlink(existing[0].filePath).catch(() => {});
    }

    try {
      const upsertValues = {
        userId: req.userId,
        fileName: file.originalname,
        fileType: file.mimetype,
        filePath: file.path,
        status: "processing" as const,
        extractedText: null as string | null,
        isActive: true,
      };

      let [resume] = existing.length > 0
        ? await db
            .update(resumesTable)
            .set({ ...upsertValues, updatedAt: new Date() })
            .where(eq(resumesTable.userId, req.userId))
            .returning()
        : await db.insert(resumesTable).values(upsertValues).returning();

      // Extract text asynchronously
      extractText(file.path, file.mimetype)
        .then((text) =>
          db
            .update(resumesTable)
            .set({ extractedText: text, status: "ready", updatedAt: new Date() })
            .where(eq(resumesTable.userId, req.userId))
        )
        .catch(() =>
          db
            .update(resumesTable)
            .set({ status: "failed", updatedAt: new Date() })
            .where(eq(resumesTable.userId, req.userId))
        );

      return res.status(201).json({
        id: resume.id,
        fileName: resume.fileName,
        status: resume.status,
        message: "Resume uploaded. Text extraction in progress.",
      });
    } catch (err) {
      req.log.error(err);
      return res.status(500).json({ error: "Upload failed" });
    }
  },
);

router.delete("/resume", requireAuth, async (req: any, res) => {
  try {
    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, req.userId));
    if (!resume) return res.status(404).json({ error: "No resume found" });

    await db
      .update(resumesTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(resumesTable.userId, req.userId));

    await fs.unlink(resume.filePath).catch(() => {});

    return res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resume/extract-keywords", requireAuth, async (req: any, res) => {
  try {
    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, req.userId));

    if (!resume || !resume.isActive) {
      return res.status(404).json({ error: "No active resume found" });
    }
    if (resume.status !== "ready" || !resume.extractedText) {
      return res.status(400).json({ error: "Resume text not yet extracted. Please wait." });
    }

    const { system, user } = prompts.keywordExtraction(resume.extractedText);
    const raw = await chatComplete(system, user);

    type ExtractedKeywords = {
      primary_role?: string;
      qa_skills?: string[];
      automation_tools?: string[];
      programming_languages?: string[];
      testing_types?: string[];
      frameworks?: string[];
      domains?: string[];
      certifications?: string[];
      cloud_devops?: string[];
      years_of_experience?: number;
    };

    const extracted = parseJsonResponse<ExtractedKeywords>(raw);

    // Delete only previous resume-generated keywords — preserve user_added and user_edited
    await db
      .delete(keywordsTable)
      .where(and(eq(keywordsTable.userId, req.userId), eq(keywordsTable.source, "resume_generated")));

    const toInsert: Array<{ userId: string; keyword: string; category: string; source: string }> = [];

    const addKeywords = (items: string[] | undefined, category: string) => {
      (items ?? []).forEach((kw) => {
        if (kw?.trim()) {
          toInsert.push({ userId: req.userId, keyword: kw.trim(), category, source: "resume_generated" });
        }
      });
    };

    if (extracted.primary_role) {
      toInsert.push({ userId: req.userId, keyword: extracted.primary_role, category: "primary_role", source: "resume_generated" });
    }
    addKeywords(extracted.qa_skills, "qa_skill");
    addKeywords(extracted.automation_tools, "automation_tool");
    addKeywords(extracted.programming_languages, "programming_language");
    addKeywords(extracted.testing_types, "testing_type");
    addKeywords(extracted.frameworks, "framework");
    addKeywords(extracted.domains, "domain");
    addKeywords(extracted.certifications, "certification");
    addKeywords(extracted.cloud_devops, "cloud_devops");

    const inserted = toInsert.length > 0
      ? await db.insert(keywordsTable).values(toInsert).returning()
      : [];

    return res.json({
      keywords: inserted,
      yearsOfExperience: extracted.years_of_experience ?? null,
    });
  } catch (err) {
    req.log.error(err);
    if ((err as Error).message?.includes("OPENAI_API_KEY")) {
      return res.status(503).json({ error: "AI service not configured. Add OPENAI_API_KEY to secrets." });
    }
    return res.status(500).json({ error: "Keyword extraction failed" });
  }
});

export default router;
