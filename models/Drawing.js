import mongoose from "mongoose";

const drawingSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true,
    unique: true,
  },
  shapes: Array, // store your shapes array directly
}, { timestamps: true });

export default mongoose.model("Drawing", drawingSchema);