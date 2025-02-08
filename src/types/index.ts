export interface PaymentRequestBody {
  entityId: string;
  entityType: "Agents" | "Client";
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  description: string;
  relatedTickets?: string[];
  paymentDate?: string;
}

export interface ManualLedgerEntryBody {
  entityId: string;
  entityType: "Agents" | "Client";
  transactionType: "debit" | "credit";
  amount: number;
  description: string;
  referenceNumber: string;
  date?: string;
}

export interface LedgerQueryParams {
  entityId?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}
