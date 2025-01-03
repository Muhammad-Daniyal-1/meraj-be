import { Router } from "express";
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
} from "../controllers/ticketsController";

const router = Router();

router.get("/get-all", getTickets);
router.get("/get-ticket/:id", getTicketById);
router.post("/create", createTicket);
router.put("/update/:id", updateTicket);
router.delete("/delete/:id", deleteTicket);

export default router;
