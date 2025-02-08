// routes.ts
import express from "express";
import { generateReceiptPdf } from "../controllers/receiptController";

const router = express.Router();

router.get("/download-receipt", generateReceiptPdf);

export default router;
