import { Router } from "express";
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
} from "../controllers/ticketsController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/get-all", authMiddleware, getTickets);
router.get("/get-ticket/:id", authMiddleware, getTicketById);
router.post("/create", authMiddleware, createTicket);
router.patch("/update/:id", authMiddleware, updateTicket);
router.delete("/delete/:id", authMiddleware, deleteTicket); 

export default router;
