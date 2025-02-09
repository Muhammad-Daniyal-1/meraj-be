import { Router } from "express";
import {
  createPaymentMethodDropdown,
  deletePaymentMethodDropdown,
  getPaymentMethodDropdowns,
  getPaymentMethodDropdownById,
  updatePaymentMethodDropdown,
} from "../controllers/paymentMethodDropdownController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/get-all", authMiddleware, getPaymentMethodDropdowns);
router.get(
  "/get-payment-method/:id",
  authMiddleware,
  getPaymentMethodDropdownById
);
router.post("/create", authMiddleware, createPaymentMethodDropdown);
router.delete("/delete/:id", authMiddleware, deletePaymentMethodDropdown);
router.patch("/update/:id", authMiddleware, updatePaymentMethodDropdown);

export default router;
