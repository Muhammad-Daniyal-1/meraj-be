import { Router } from "express";
import {
  createPaymentMethodDropown,
  deletePaymentMethodDropown,
  getPaymentMethodDropowns,
  getPaymentMethodDropownById,
  updatePaymentMethodDropown,
} from "../controllers/paymentMethodDropownController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/get-all", authMiddleware, getPaymentMethodDropowns);
router.get(
  "/get-payment-method/:id",
  authMiddleware,
  getPaymentMethodDropownById
);
router.post("/create", authMiddleware, createPaymentMethodDropown);
router.delete("/delete/:id", authMiddleware, deletePaymentMethodDropown);
router.patch("/update/:id", authMiddleware, updatePaymentMethodDropown);

export default router;
