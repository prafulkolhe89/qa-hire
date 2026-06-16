import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import jobsRouter from "./jobs";
import feedbackRouter from "./feedback";
import telegramRouter from "./telegram";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(jobsRouter);
router.use(feedbackRouter);
router.use(telegramRouter);
router.use(statsRouter);

export default router;
