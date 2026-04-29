import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import drawingRoutes from "./routes/drawingRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_URL = process.env.CLIENT_URL || "";

const allowedOrigins = CLIENT_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients/tools and same-origin requests.
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);
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