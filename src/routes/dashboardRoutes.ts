import { Router } from "express";
import { getDashboardData } from "../controllers/dashboardController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authMiddleware, getDashboardData);

export default router;
