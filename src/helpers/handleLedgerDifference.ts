import { createLedgerEntryWithType } from "../controllers/ledgerController";
import mongoose from "mongoose";

interface LedgerDiffParams {
  difference: number;
  entityId: string | mongoose.Types.ObjectId;
  entityType: "Agents" | "Tickets";
  ticketId: string | mongoose.Types.ObjectId;
  referenceNumber: string;
  descriptionPrefix: string;
  isAgentCard?: boolean;
}

export async function handleLedgerDifference({
  difference,
  entityId,
  entityType,
  ticketId,
  referenceNumber,
  descriptionPrefix,
  isAgentCard = false,
}: LedgerDiffParams) {
  try {
    // If difference > 0 => "debit", difference < 0 => "credit"
    const transactionType = isAgentCard
      ? "no-effect"
      : difference > 0
      ? "debit"
      : "credit";

    // The ledger "amount" is always the absolute value of the difference
    const amount = Math.abs(difference);

    // Example description
    const description = `${descriptionPrefix} updated by ${difference} (old->new) on ticket update`;

    await createLedgerEntryWithType(
      entityId,
      entityType,
      ticketId,
      amount,
      referenceNumber,
      description,
      transactionType
    );
  } catch (err) {
    console.error("Error creating ledger difference entry:", err);
    throw err; // or just log
  }
}
