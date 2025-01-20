import express from "express";
import {
  recordPayment,
  getLedgerByEntity,
  getLedgers,
  createManualLedgerEntry,
  getLedgerSummary,
  getAllPayments,
} from "../controllers/ledgerController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

// Apply authentication middleware to all ledger routes
router.use(authMiddleware);

// Record a payment
router.post("/payment", authMiddleware, recordPayment);
router.get("/payment", authMiddleware, getAllPayments);

// Create manual ledger entry
router.post("/manual-entry", createManualLedgerEntry);

// Get summary of all ledgers (new endpoint)
router.get("/summary", getLedgerSummary);

// Get ledger entries for an entity
router.get("/get-all", getLedgers);
router.get("/get-entity-ledger/:entityId", getLedgerByEntity);

export default router;
