import mongoose from "mongoose";
import { config } from "./index";

export const ConnectToMongo = () => {
  mongoose.connect(config.dbUri);
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", function () {
    console.log("Connected to MongoDB");
  });
};
