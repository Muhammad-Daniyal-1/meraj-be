import { Request, Response } from "express";
import { Tickets } from "../models/ticketsModel";

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    // Retrieve the filter query parameter (if not provided, default to "currentMonth")
    const timeFilter = req.query.filter
      ? req.query.filter.toString()
      : "currentMonth";
    const endDate = new Date();
    let startDate: Date | null = null;

    // Determine the date range based on the filter.
    switch (timeFilter) {
      case "currentMonth":
        // From the beginning of the current month until now.
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case "1month":
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "3month":
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "6month":
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "1year":
        startDate = new Date(endDate);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "full":
        // No date filtering when "full" is selected.
        startDate = null;
        break;
      default:
        // Fallback to current month stats if an unknown filter is provided.
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }

    // Build the match criteria using issueDate.
    const matchStage: any = {};
    if (startDate) {
      matchStage.issueDate = { $gte: startDate, $lte: endDate };
    }

    // Aggregation pipeline to calculate the dashboard stats:
    // - totalProfit: Sum of profit (works correctly with negative values)
    // - totalOperations: Count of tickets (operations)
    // - totalPaidTickets: Count tickets with paymentType "full payment"
    // - totalUnpaidTickets: Count tickets with paymentType "partial payment"
    // - totalSegments: Sum of segment values after converting them from strings to numbers
    const aggregationPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: "$profit" },
          totalOperations: { $sum: 1 },
          totalPaidTickets: {
            $sum: {
              $cond: [{ $eq: ["$paymentType", "Full"] }, 1, 0],
            },
          },
          totalUnpaidTickets: {
            $sum: {
              $cond: [{ $eq: ["$paymentType", "Partial"] }, 1, 0],
            },
          },
          totalSegments: {
            $sum: {
              $convert: {
                input: { $ifNull: ["$segment", "0"] },
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
      },
    ];

    const result = await Tickets.aggregate(aggregationPipeline);

    // If no matching tickets are found, default the values to zero.
    const dashboardData = result[0] || {
      totalProfit: 0,
      totalOperations: 0,
      totalPaidTickets: 0,
      totalUnpaidTickets: 0,
      totalSegments: 0,
    };

    res.json({
      totalProfit: dashboardData.totalProfit,
      totalOperations: dashboardData.totalOperations,
      totalPaidTickets: dashboardData.totalPaidTickets,
      totalUnpaidTickets: dashboardData.totalUnpaidTickets,
      totalSegments: dashboardData.totalSegments,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};
