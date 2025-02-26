import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 5001,
  dbUri: process.env.DATABASE_URI 
};
