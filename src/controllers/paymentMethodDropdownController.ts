import { Request, Response } from "express";
import { PaymentMethodDropdown } from "../models/paymentMethodDropownModel";

export const getPaymentMethodDropdowns = async (
  req: Request,
  res: Response
) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    // Query for search functionality
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { type: { $regex: search, $options: "i" } },
            { methodFor: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Fetching payment method dropown with pagination and search query
    const paymentMethodDropdown = await PaymentMethodDropdown.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    // Total count for pagination
    const totalPaymentMethodDropdown =
      await PaymentMethodDropdown.countDocuments(query);

    res.json({
      success: true,
      message: "Payment method dropown fetched successfully",
      paymentMethodDropdown,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalPaymentMethodDropdown / limitNumber),
        totalPaymentMethodDropdown,
      },
    });
  } catch (error) {
    console.error("Error fetching payment method dropown:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const getPaymentMethodDropdownById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const paymentMethodDropdown = await PaymentMethodDropdown.findById(id);
    res.json({ success: true, paymentMethodDropdown });
  } catch (error) {
    console.error("Error fetching payment method dropown:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const createPaymentMethodDropdown = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).userId;
    const { name, type, methodFor } = req.body;
    const paymentMethodDropown = await PaymentMethodDropdown.create({
      user,
      name,
      type,
      methodFor,
    });
    res.json({
      success: true,
      paymentMethodDropown,
      message: "Payment method dropown created successfully",
    });
  } catch (error) {
    console.error("Error creating payment method dropown:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const updatePaymentMethodDropdown = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const paymentMethodDropown = await PaymentMethodDropdown.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true }
    );
    res.json({
      success: true,
      paymentMethodDropown,
      message: "Payment method dropown updated successfully",
    });
  } catch (error) {
    console.error("Error updating payment method dropown:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const deletePaymentMethodDropdown = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const paymentMethodDropown = await PaymentMethodDropdown.findByIdAndDelete(
      id
    );
    res.json({
      success: true,
      paymentMethodDropown,
      message: "Payment method dropown deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment method dropown:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};
