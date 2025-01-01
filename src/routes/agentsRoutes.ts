import { Router } from "express";
import {
  createAgent,
  deleteAgent,
  getAgents,
  getAgentById,
  updateAgent,
} from "../controllers/agentsContoller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// agent routes
router.get("/get-all", authMiddleware, getAgents);
router.post("/create", authMiddleware, createAgent);
router.get("/get-agent/:id", authMiddleware, getAgentById);
router.patch("/update/:id", authMiddleware, updateAgent);
router.delete("/delete/:id", authMiddleware, deleteAgent);

export default router;
