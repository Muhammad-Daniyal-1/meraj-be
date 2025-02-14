import { Request, Response, RequestHandler } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/usersModel";
import { addUserSchema, loginSchema } from "./schema";
import jwt from "jsonwebtoken";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    // Query for search functionality
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { username: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Fetching users with pagination and search query
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .select("-password")
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    // Total count for pagination
    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      message: "Users fetched successfully",
      users,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalUsers / limitNumber),
        totalUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    let userId;
    const { id } = req.params;
    if (id === "me") {
      userId = (req as any).userId;
    } else {
      userId = id;
    }

    const user = await User.findById({ _id: userId }).select("-password");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate the request body
    const { error, value } = addUserSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        success: false,
        error: error.details.map((err: any) => err.message),
      });
      return;
    }

    const { name, username, password, role, isActive, permissions } = value;

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ success: false, error: "User already exists" });
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = new User({
      name,
      username,
      password: hashedPassword,
      role,
      isActive,
      permissions,
    });

    await user.save();

    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const updateUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, password, role, isActive, permissions } = req.body;

    // Initialize an update object
    const updateData: Record<string, any> = {};

    // Add fields to updateData only if they exist in the request body
    updateData.isActive = isActive;
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;

    // Hash the password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update the user and exclude password from the response
    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      fields: { password: 0 },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      res.status(400).json({
        success: false,
        error: error.details.map((err: any) => err.message),
      });
      return;
    }

    const { username, password } = value;

    const user = await User.findOne({ username });

    if (!user) {
      res.status(400).json({ success: false, error: "User not found" });
      return;
    }

    if (user.isActive === false) {
      res.status(400).json({
        success: false,
        error: "Blocked by admin. Contact admin for more information",
      });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      res.status(400).json({ success: false, error: "Invalid password" });
      return;
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "default_secret",
      {
        expiresIn: "7d",
      }
    );

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "none",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({
      success: false,
      message: "Failed to login",
      error: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logout successful" });
};
