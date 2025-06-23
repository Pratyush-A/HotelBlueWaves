import express from "express";
import Booking from "../models/Booking.js";
import Guest from "../models/Guest.js";
import Room from "../models/Room.js";
import cloudinary from "../lib/cloudinary.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// 📌 Create a Booking
router.post("/", protectRoute, async (req, res) => {
  try {
    const {
      guestName,
      phone,
      idProof,
      roomNumber,
      checkInDate,
      checkOutDate,
    } = req.body;

    if (!guestName || !phone || !idProof || !roomNumber || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Find Room
    const room = await Room.findOne({ number: roomNumber });
    if (!room) return res.status(404).json({ message: "Room not found" });

    // ✅ Format check-in/check-out dates to match hotel policy
    const formattedCheckIn = new Date(checkInDate);
    formattedCheckIn.setHours(9, 0, 0, 0); // 9:00 AM check-in

    const formattedCheckOut = new Date(checkOutDate);
    formattedCheckOut.setHours(8, 0, 0, 0); // 8:00 AM checkout

    // ✅ Check for conflicting bookings
    const conflict = await Booking.findOne({
      room: room._id,
      checkIn: { $lt: formattedCheckOut },
      checkOut: { $gt: formattedCheckIn },
    });

    if (conflict) {
      return res.status(400).json({ message: "Room is already booked for those dates" });
    }

    // ✅ Upload ID Proof to Cloudinary
    const upload = await cloudinary.uploader.upload(idProof);
    const idProofUrl = upload.secure_url;

    // ✅ Create Guest
    const guest = new Guest({
      name: guestName,
      phone,
      idProofUrl,
    });
    await guest.save();

    // ✅ Create Booking
    const booking = new Booking({
      guest: guest._id,
      room: room._id,
      checkIn: formattedCheckIn,
      checkOut: formattedCheckOut,
    });
    await booking.save();

    res.status(201).json({
      message: "Booking successful",
      bookingId: booking._id,
      guest,
      room,
    });

  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ message: err.message || "Failed to book room" });
  }
});

// 📌 Get All Bookings
router.get("/", protectRoute, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("guest")
      .populate("room");
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

router.put("/extend/:bookingId", protectRoute, async (req, res) => {
  try {
    const { newCheckOutDate } = req.body;
    const { bookingId } = req.params;

    if (!newCheckOutDate) {
      return res.status(400).json({ message: "New check-out date required" });
    }

    const booking = await Booking.findById(bookingId).populate("room");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const newCheckout = new Date(newCheckOutDate);
    newCheckout.setHours(8, 0, 0, 0); // Guest will leave by 8 AM on new checkout day

    const currentCheckOut = new Date(booking.checkOut);
    if (newCheckout <= currentCheckOut) {
      return res.status(400).json({ message: "New check-out must be after current check-out" });
    }

    // Check for conflicts after current check-out
    const conflict = await Booking.findOne({
      room: booking.room._id,
      checkIn: { $lt: newCheckout },
      checkOut: { $gt: currentCheckOut }
    });

    if (conflict) {
      return res.status(400).json({ message: "Room is already booked during the extended period" });
    }

    booking.checkOut = newCheckout;
    await booking.save();

    res.json({
      message: "Stay extended successfully",
      updatedBooking: booking,
    });

  } catch (error) {
    console.error("Extend stay error:", error);
    res.status(500).json({ message: "Failed to extend stay" });
  }
});

export default router;
