import express from "express";
import Guest from "../models/Guest.js";
import cloudinary from "../lib/cloudinary.js";

const router = express.Router();

// @route   POST /api/guests
// @desc    Create a new guest with Cloudinary ID upload
router.post("/", async (req, res) => {
  try {
    const { name, phone, idProof } = req.body;

    // Log to debug incoming body (can be removed later)
    console.log("Received guest data:", { name, phone, idProof: idProof?.substring(0, 50) });

    if (!name || !phone || !idProof) {
      return res.status(400).json({ message: "All fields are not required" });
    }

    // Upload ID proof image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(idProof, {
      folder: "hotel-id-proofs",
    });

    const guest = new Guest({
      name,
      phone,
      idProofUrl: uploadResponse.secure_url,
    });

    await guest.save();

    return res.status(201).json(guest);
  } catch (err) {
    console.error("Error in guest creation:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// @route   GET /api/guests
router.get("/", async (req, res) => {
  try {
    const guests = await Guest.find();
    return res.status(200).json(guests);
  } catch (err) {
    console.error("Fetch guest error:", err);
    return res.status(500).json({ error: "Failed to fetch guests" });
  }
});

export default router;
