import mongoose from "mongoose";

const guestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  idProofUrl: { type: String, required: true },
});

export default mongoose.model("Guest", guestSchema);
