import express from "express";
import {
  recordPayment,
  getLedgerByEntity,
  getLedgers,
  createManualLedgerEntry
} from "../controllers/ledgerController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

// Apply authentication middleware to all ledger routes
router.use(authMiddleware);

// Record a payment
router.post("/payment", recordPayment);

// Create manual ledger entry
router.post("/manual-entry", createManualLedgerEntry);

// Get ledger entries for an entity
router.get("/get-all", getLedgers);
router.get("/get-entity-ledger", getLedgerByEntity);

export default router;
