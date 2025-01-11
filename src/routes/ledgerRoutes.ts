import express from "express";
import { recordPayment, getLedger } from "../controllers/ledgerController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

// Apply authentication middleware to all ledger routes
router.use(authMiddleware);

// Record a payment
router.post("/payment", recordPayment);

// Get ledger entries for an entity
// @ts-ignore
router.get("/", getLedger);

export default router;
