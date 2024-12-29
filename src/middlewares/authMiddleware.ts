import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from cookies
    const token = req.cookies?.token;

    if (!token) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Token not provided" });
    }

    // Verify the token
    const secretKey = process.env.JWT_SECRET || "default_secret"; // Ensure you replace with your actual secret key
    const decodedToken = jwt.verify(token, secretKey) as { userId: string };
    // Attach userId to request for further use
    (req as any).userId = decodedToken.userId;

    // If the token is valid, proceed to the next middleware
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
