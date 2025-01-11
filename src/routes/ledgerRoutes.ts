import express from "express";
import { 
  recordPayment, 
  getLedger,
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
// @ts-ignore
router.get("/", getLedger);

export default router;
