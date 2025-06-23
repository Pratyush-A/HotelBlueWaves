import express from "express";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";

const router = express.Router();

// ✅ Room stats route (based on today's bookings, not static field)
router.get("/stats", async (req, res) => {
  try {
    const baseDate = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(baseDate.setHours(9,0,0,0));              // 9 AM on base day
    const end = new Date(baseDate);
    end.setDate(end.getDate() + 1);
    end.setHours(8,0,0,0);                                           // 8 AM next day

    const total = await Room.countDocuments();
    const occupiedIds = await Booking.find({
      checkIn: { $lt: end },
      checkOut: { $gt: start }
    }).distinct("room");
    const occupied = occupiedIds.length;

    res.json({ total, occupied, available: total - occupied });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get("/available", async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    if (!checkIn || !checkOut) return res.status(400).json({ message: "Need both dates" });

    const start = new Date(checkIn); start.setHours(9,0,0,0);
    const end = new Date(checkOut); end.setHours(8,0,0,0);

    const busyIds = await Booking.find({
      checkIn: { $lt: end },
      checkOut: { $gt: start }
    }).distinct("room");

    const available = await Room.find({ _id: { $nin: busyIds } });
    res.json(available);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});




// ✅ Occupied rooms on a specific date (for dashboard)
router.get("/occupied", async (req, res) => {
  try {
    const rawDate = req.query.date ? new Date(req.query.date) : new Date();

    // Define start and end range for that day (using actual check-in/out times)
    const startOfDay = new Date(rawDate);
    startOfDay.setHours(8, 0, 0, 0); // 8:00 AM (room should be empty by then)

    const endOfDay = new Date(rawDate);
    endOfDay.setHours(23, 59, 59, 999); // End of the day

    const occupiedRoomIds = await Booking.find({
      checkIn: { $lt: endOfDay },   // Checked in before end of the day
      checkOut: { $gt: startOfDay } // Still not checked out by 8:00 AM
    }).distinct("room");

    const occupiedRooms = await Room.find({ _id: { $in: occupiedRoomIds } });
    res.json(occupiedRooms);
  } catch (error) {
    console.error("Error fetching occupied rooms:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



// ✅ Create a new room
router.post("/", async (req, res) => {
  try {
    const { number, type, price, status } = req.body;
    const newRoom = new Room({ number, type, price, status });
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Get all rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Get a room by ID (must be after all specific routes)
router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Update room
router.put("/:id", async (req, res) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedRoom);
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ✅ Delete room
router.delete("/:id", async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: "Room deleted" });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
