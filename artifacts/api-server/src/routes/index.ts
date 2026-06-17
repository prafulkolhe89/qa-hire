import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import jobsRouter from "./jobs";
import feedbackRouter from "./feedback";
import telegramRouter from "./telegram";
import statsRouter from "./stats";
import resumeRouter from "./resume";
import keywordsRouter from "./keywords";
import aiFeaturesRouter from "./ai-features";
import subscriptionRouter from "./subscription";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(jobsRouter);
router.use(feedbackRouter);
router.use(telegramRouter);
router.use(statsRouter);
router.use(resumeRouter);
router.use(keywordsRouter);
router.use(aiFeaturesRouter);
router.use(subscriptionRouter);

export default router;
