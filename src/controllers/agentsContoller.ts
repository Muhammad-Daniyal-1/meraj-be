import { Request, Response } from "express";
import { Agents } from "../models/agentsModel";
import { createAgentSchema } from "./schema";

export const getAgents = async (req: Request, res: Response) => {
  try {
    console.log("getAgents", req.query);
    const { page = 1, limit = 20, search = "" } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    // Query for search functionality
    const query = search
      ? {
          $or: [
            { id: { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Fetching agents with pagination and search query
    const agents = await Agents.find(query)
      .sort({ createdAt: -1 })
      .select("-password")
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    // Total count for pagination
    const totalAgents = await Agents.countDocuments(query);

    res.json({
      success: true,
      message: "Agents fetched successfully",
      agents,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalAgents / limitNumber),
        totalAgents,
      },
    });
  } catch (error) {
    console.error("Error fetching agents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch agents",
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const getAgentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await Agents.findById(id);

    if (!agent) {
      res.status(404).json({ success: false, message: "Agent not found" });
      return;
    }

    res.json({ success: true, agent });
  } catch (error) {
    console.error("Error fetching agent:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const createAgent = async (req: Request, res: Response) => {
  try {
    const { error, value } = createAgentSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({ success: false, error: error.details });
    }

    const existingAgent = await Agents.findOne({ id: value.id });
    if (existingAgent) {
      res.status(400).json({ success: false, error: "Agent already exists" });
      return;
    }

    const userId = (req as any).userId;

    const newAgent = await Agents.create({ ...value, userId });
    res.json({ success: true, agent: newAgent });
  } catch (error) {
    console.error("Error creating agent:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const updateAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingAgent = await Agents.findOne({ _id: id });
    if (!existingAgent) {
      res.status(404).json({ success: false, error: "Agent not found" });
      return;
    }

    const userId = (req as any).userId;

    const agent = await Agents.findByIdAndUpdate(
      id,
      { ...req.body, userId },
      { new: true }
    );
    res.json({ success: true, agent });
  } catch (error) {
    console.error("Error updating agent:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const deleteAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await Agents.findByIdAndDelete(id);

    if (!agent) {
      res.status(404).json({ success: false, message: "Agent not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Agent deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting agent:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};
