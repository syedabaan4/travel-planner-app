const bookingModel = require("../models/bookingModel");

// Get all bookings (admin only)
async function getAllBookings(req, res) {
  try {
    const bookings = await bookingModel.getAllBookings();
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: error.message });
  }
}

// Get customer's bookings
async function getCustomerBookings(req, res) {
  try {
    const customerId = req.params.customerId;

    // If customer role, ensure they can only access their own bookings
    if (req.user.role === "customer" && req.user.id != customerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const bookings = await bookingModel.getBookingsByCustomerId(customerId);
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching customer bookings:", error);
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: error.message });
  }
}

// Get booking by ID
async function getBookingById(req, res) {
  try {
    const bookingId = req.params.id;
    const booking = await bookingModel.getBookingById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // If customer role, ensure they can only access their own booking
    if (req.user.role === "customer" && req.user.id != booking.customerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res
      .status(500)
      .json({ message: "Error fetching booking", error: error.message });
  }
}

// Create booking from catalog
async function createBookingFromCatalog(req, res) {
  try {
    const {
      customerId,
      catalogId,
      bookingDescription,
      checkIn,
      checkOut,
      travelDate,
    } = req.body;

    // If customer role, ensure they can only create booking for themselves
    if (req.user.role === "customer" && req.user.id != customerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!customerId || !catalogId || !checkIn || !checkOut || !travelDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const bookingId = await bookingModel.createBookingFromCatalog({
      customerId,
      catalogId,
      bookingDescription,
      checkIn,
      checkOut,
      travelDate,
    });

    res.status(201).json({
      message: "Booking created successfully",
      bookingId,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res
      .status(500)
      .json({ message: "Error creating booking", error: error.message });
  }
}

// Create custom booking
async function createCustomBooking(req, res) {
  try {
    const { customerId, bookingDescription, hotels, transport, food } =
      req.body;

    // If customer role, ensure they can only create booking for themselves
    if (req.user.role === "customer" && req.user.id != customerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!customerId) {
      return res.status(400).json({ message: "customerId is required" });
    }

    if (!hotels && !transport && !food) {
      return res
        .status(400)
        .json({
          message: "At least one service (hotel/transport/food) is required",
        });
    }

    const bookingId = await bookingModel.createCustomBooking({
      customerId,
      bookingDescription,
      hotels,
      transport,
      food,
    });

    res.status(201).json({
      message: "Custom booking created successfully",
      bookingId,
    });
  } catch (error) {
    console.error("Error creating custom booking:", error);
    res
      .status(500)
      .json({ message: "Error creating custom booking", error: error.message });
  }
}

// Update booking status
async function updateBookingStatus(req, res) {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    await bookingModel.updateBookingStatus(bookingId, status);
    res.json({ message: "Booking status updated successfully" });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res
      .status(500)
      .json({ message: "Error updating booking status", error: error.message });
  }
}

// Delete booking
async function deleteBooking(req, res) {
  try {
    const bookingId = req.params.id;

    // Get booking to check ownership
    const booking = await bookingModel.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // If customer role, ensure they can only delete their own booking
    if (req.user.role === "customer" && req.user.id != booking.customerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await bookingModel.deleteBooking(bookingId);
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res
      .status(500)
      .json({ message: "Error deleting booking", error: error.message });
  }
}

module.exports = {
  getAllBookings,
  getCustomerBookings,
  getBookingById,
  createBookingFromCatalog,
  createCustomBooking,
  updateBookingStatus,
  deleteBooking,
};
