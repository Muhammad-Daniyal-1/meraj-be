import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from cookies
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({ error: "Unauthorized access" });
      return; // Ensure the response cycle ends here
    }

    // Verify the token
    const secretKey = process.env.JWT_SECRET || "default_secret"; // Replace with your actual secret key
    const decodedToken = jwt.verify(token, secretKey) as { userId: string };

    // Attach userId to the request for further use
    (req as any).userId = decodedToken.userId;

    // If the token is valid, proceed to the next middleware
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
