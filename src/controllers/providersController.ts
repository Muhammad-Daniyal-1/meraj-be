import { Request, Response } from "express";
import { Providers } from "../models/providersModel";
import { createProviderSchema } from "./schema";

export const getProviders = async (req: Request, res: Response) => {
  try {
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

    // Fetching providers with pagination and search query
    const providers = await Providers.find(query)
      .sort({ createdAt: -1 })
      .select("-password")
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    // Total count for pagination
    const totalProviders = await Providers.countDocuments(query);

    res.json({
      success: true,
      message: "Providers fetched successfully",
      providers,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalProviders / limitNumber),
        totalProviders,
      },
    });
  } catch (error) {
    console.error("Error fetching providers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch providers",
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const getProviderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const provider = await Providers.findById(id);

    if (!provider) {
      res.status(404).json({ success: false, message: "Provider not found" });
      return;
    }

    res.json({ success: true, provider });
  } catch (error) {
    console.error("Error fetching provider:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const createProvider = async (req: Request, res: Response) => {
  try {
    const { error, value } = createProviderSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({ success: false, error: error.details });
    }

    const existingProvider = await Providers.findOne({ id: value.id });
    if (existingProvider) {
      res
        .status(400)
        .json({ success: false, error: "Provider already exists" });
      return;
    }

    const userId = (req as any).userId;

    const newProvider = await Providers.create({ ...value, userId });
    res.json({ success: true, provider: newProvider });
  } catch (error) {
    console.error("Error creating provider:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const updateProvider = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingProvider = await Providers.findOne({ _id: id });
    if (!existingProvider) {
      res.status(404).json({ success: false, error: "Provider not found" });
      return;
    }

    const userId = (req as any).userId;

    const provider = await Providers.findByIdAndUpdate(
      id,
      { ...req.body, userId },
      { new: true }
    );
    res.json({ success: true, provider });
  } catch (error) {
    console.error("Error updating provider:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const deleteProvider = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const provider = await Providers.findByIdAndDelete(id);

    if (!provider) {
      res.status(404).json({ success: false, message: "Provider not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Provider deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting provider:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};
