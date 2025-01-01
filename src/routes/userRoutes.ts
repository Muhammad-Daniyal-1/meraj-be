import { Router } from "express";
import {
  createUser,
  getUserById,
  getUsers,
  login,
  logout,
  updateUser,
  deleteUser,
} from "../controllers/usersController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// user routes
router.get("/get-all", authMiddleware, getUsers);
router.post("/create", authMiddleware, createUser);
router.get("/get-user/:id", authMiddleware, getUserById);
router.patch("/update/:id", authMiddleware, updateUser);
router.delete("/delete/:id", authMiddleware, deleteUser);

// auth routes
router.post("/login", login);
router.post("/logout", logout);

export default router;
