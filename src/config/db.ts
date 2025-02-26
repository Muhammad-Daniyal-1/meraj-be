import mongoose from "mongoose";
import { config } from "./index";

export const ConnectToMongo = () => {
  mongoose.connect('mongodb://merajAdmin:127060nabeeljunaid87690@147.93.90.105:27017/merajtravel?authSource=admin');
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", function () {
    console.log("Connected to MongoDB");
  });
};
