import { Router } from "express";
import {
  createUser,
  getUsers,
  login,
  logout,
} from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/get-all", authMiddleware, getUsers);
router.post("/create", createUser);
router.post("/login", login);
router.post("/logout", logout);

export default router;
