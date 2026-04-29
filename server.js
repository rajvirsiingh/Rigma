import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import drawingRoutes from "./routes/drawingRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());
app.use("/api/drawings", drawingRoutes);

app.get("/", (req, res) => {
  res.send("API running...");
});

if (!MONGO_URI) {
  console.error("Missing MONGO_URI. Add it to server/.env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });