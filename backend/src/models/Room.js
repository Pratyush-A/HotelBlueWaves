import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ["available", "occupied"], default: "available" },
});

export default mongoose.model("Room", roomSchema);
