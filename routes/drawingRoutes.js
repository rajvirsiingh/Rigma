import express from "express";
import Drawing from "../models/Drawing.js";

const router = express.Router();

const getValidName = (name) => (typeof name === "string" ? name.trim() : "");

router.post("/save", async (req, res) => {
  try {
    const { name, shapes } = req.body;
    const validName = getValidName(name);

    if (!Array.isArray(shapes)) {
      return res.status(400).json({ message: "Shapes must be an array" });
    }
    if (!validName) {
      return res.status(400).json({ message: "Name is required" });
    }

    const drawing = await Drawing.findOneAndUpdate(
      { name: validName },
      { name: validName, shapes },
      { new: true }
    );

    if (!drawing) {
      return res.status(404).json({ message: "Drawing name not found" });
    }

    return res.json(drawing);
  } catch (error) {
    return res.status(500).json({ message: "Failed to save drawing" });
  }
});

router.post("/save-as", async (req, res) => {
  try {
    const { name, shapes } = req.body;
    const validName = getValidName(name);

    if (!Array.isArray(shapes)) {
      return res.status(400).json({ message: "Shapes must be an array" });
    }
    if (!validName) {
      return res.status(400).json({ message: "Name is required" });
    }

    const existingDrawing = await Drawing.findOne({ name: validName });
    if (existingDrawing) {
      return res.status(409).json({ message: "A drawing with this name already exists" });
    }

    const drawing = new Drawing({ name: validName, shapes });
    await drawing.save();

    return res.status(201).json(drawing);
  } catch (error) {
    return res.status(500).json({ message: "Failed to save drawing as new" });
  }
});

router.get("/latest", async (_req, res) => {
  try {
    const drawing = await Drawing.findOne().sort({ createdAt: -1 });
    if (!drawing) {
      return res.status(404).json({ message: "No saved drawings found" });
    }
    return res.json(drawing);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load latest drawing" });
  }
});

router.get("/names", async (_req, res) => {
  try {
    const drawings = await Drawing.find({}, { _id: 1, name: 1 }).sort({ updatedAt: -1 });
    return res.json(drawings);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load drawing names" });
  }
});

router.get("/name/:name", async (req, res) => {
  try {
    const drawing = await Drawing.findOne({ name: getValidName(req.params.name) });
    if (!drawing) {
      return res.status(404).json({ message: "Drawing not found" });
    }
    return res.json(drawing);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load drawing" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    if (!drawing) {
      return res.status(404).json({ message: "Drawing not found" });
    }
    return res.json(drawing);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load drawing" });
  }
});

export default router;