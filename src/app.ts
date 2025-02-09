import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import morgan from "morgan";
import { ConnectToMongo } from "./config/db";
import userRoutes from "./routes/userRoutes";
import agentRoutes from "./routes/agentsRoutes";
import providerRoutes from "./routes/providerRoutes";
import ticketsRoutes from "./routes/ticketsRoutes";
import ledgerRoutes from "./routes/ledgerRoutes";
import paymentMethodDropdownRoutes from "./routes/paymentMethodDropdownRoutes";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Frontend origin
    credentials: true, // Allow cookies
  })
);

app.use(morgan("dev"));

app.use(cookieParser());
app.use(bodyParser.json());

ConnectToMongo();

// home route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Express with TypeScript!");
});

// API Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/agents", agentRoutes);
app.use("/api/v1/providers", providerRoutes);
app.use("/api/v1/tickets", ticketsRoutes);
app.use("/api/v1/ledgers", ledgerRoutes);
app.use("/api/v1/payment-methods", paymentMethodDropdownRoutes);

export default app;
