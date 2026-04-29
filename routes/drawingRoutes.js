import express from "express";
import Drawing from "../models/Drawing.js";

const router = express.Router();

const getValidName = (name) => (typeof name === "string" ? name.trim() : "");
const getThumbnailShapes = (shapes) => (Array.isArray(shapes) ? shapes.slice(0, 8) : []);
const MAX_SHAPES_PAYLOAD_BYTES = 2 * 1024 * 1024;

const serializeDrawing = (drawing, extra = {}) => ({
  _id: drawing._id,
  name: drawing.name,
  shapes: drawing.shapes,
  updatedAt: drawing.updatedAt,
  ...extra,
});

const validateShapesPayload = (shapes) => {
  if (!Array.isArray(shapes)) {
    return "Shapes must be an array";
  }

  if (!shapes.every((shape) => shape && typeof shape === "object" && !Array.isArray(shape))) {
    return "Each shape must be an object";
  }

  const payloadBytes = Buffer.byteLength(JSON.stringify(shapes), "utf8");
  if (payloadBytes > MAX_SHAPES_PAYLOAD_BYTES) {
    return "Shapes payload is too large";
  }

  return null;
};

router.post("/save", async (req, res) => {
  try {
    const { name, shapes } = req.body;
    const validName = getValidName(name);

    if (!validName) {
      return res.status(400).json({ message: "Name is required" });
    }
    const shapeValidationError = validateShapesPayload(shapes);
    if (shapeValidationError) {
      return res.status(400).json({ message: shapeValidationError });
    }

    const drawing = await Drawing.findOneAndUpdate(
      { name: validName },
      { name: validName, shapes },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json(serializeDrawing(drawing));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "A drawing with this name already exists" });
    }
    return res.status(500).json({ message: "Failed to save drawing" });
  }
});

router.post("/save-as", async (req, res) => {
  try {
    const { name, shapes, replaceExisting = false } = req.body;
    const validName = getValidName(name);

    if (!validName) {
      return res.status(400).json({ message: "Name is required" });
    }
    const shapeValidationError = validateShapesPayload(shapes);
    if (shapeValidationError) {
      return res.status(400).json({ message: shapeValidationError });
    }

    const existingDrawing = await Drawing.findOne({ name: validName });
    if (existingDrawing) {
      if (replaceExisting) {
        existingDrawing.shapes = shapes;
        await existingDrawing.save();
        return res.json(serializeDrawing(existingDrawing, { replaced: true }));
      }
      return res.status(409).json({ message: "A drawing with this name already exists" });
    }

    const drawing = new Drawing({ name: validName, shapes });
    await drawing.save();

    return res.status(201).json(serializeDrawing(drawing, { replaced: false }));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "A drawing with this name already exists" });
    }
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

router.get("/names", async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const drawings = await Drawing.find({}, { _id: 1, name: 1, updatedAt: 1, shapes: 1 })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const payload = drawings.map((drawing) => ({
      _id: drawing._id,
      name: drawing.name || "",
      updatedAt: drawing.updatedAt,
      thumbnailShapes: getThumbnailShapes(drawing.shapes),
    }));

    let total = payload.length;
    try {
      total = await Drawing.countDocuments({});
    } catch (_countError) {
      // Fallback to current page length if counting fails.
    }

    return res.json({
      items: payload,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to load drawing names:", error);
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