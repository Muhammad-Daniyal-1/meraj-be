import { Router } from "express";
import {
  createProvider,
  deleteProvider,
  getProviders,
  getProviderById,
  updateProvider,
} from "../controllers/providersController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// agent routes
router.get("/get-all", authMiddleware, getProviders);
router.post("/create", authMiddleware, createProvider);
router.get("/get-provider/:id", authMiddleware, getProviderById);
router.patch("/update/:id", authMiddleware, updateProvider);
router.delete("/delete/:id", authMiddleware, deleteProvider);

export default router;
