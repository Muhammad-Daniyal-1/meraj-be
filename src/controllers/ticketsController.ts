import { Request, Response } from "express";
import { Tickets } from "../models/ticketsModel";
import { createTicketSchema } from "./schema";

export const getTickets = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    // Query for search functionality
    const query = search
      ? {
          $or: [
            { ticketNumber: { $regex: search, $options: "i" } },
            { clientName: { $regex: search, $options: "i" } },
            { operationType: { $regex: search, $options: "i" } },
            { departure: { $regex: search, $options: "i" } },
            { destination: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Fetching tickets with pagination and search query
    const tickets = await Tickets.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    // Total count for pagination
    const totalTickets = await Tickets.countDocuments(query);

    res.json({
      success: true,
      message: "Tickets fetched successfully",
      tickets,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalTickets / limitNumber),
        totalTickets,
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await Tickets.findById(id);

    if (!ticket) {
      res.status(404).json({ success: false, message: "Ticket not found" });
      return;
    }

    res.json({ success: true, ticket });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const { error, value } = createTicketSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({ success: false, error: error.details });
      return;
    }

    const existingTicket = await Tickets.findOne({
      ticketNumber: value.ticketNumber,
    });
    if (existingTicket) {
      res.status(400).json({ success: false, error: "Ticket already exists" });
      return;
    }

    const userId = (req as any).userId;

    const newTicket = await Tickets.create({ ...value, userId });
    res.json({ success: true, ticket: newTicket });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const updateTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingTicket = await Tickets.findOne({ _id: id });
    if (!existingTicket) {
      res.status(404).json({ success: false, error: "Ticket not found" });
      return;
    }

    const userId = (req as any).userId;

    const ticket = await Tickets.findByIdAndUpdate(
      id,
      { ...req.body, userId },
      { new: true }
    );
    res.json({ success: true, ticket });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await Tickets.findByIdAndDelete(id);

    if (!ticket) {
      res.status(404).json({ success: false, message: "Ticket not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};
