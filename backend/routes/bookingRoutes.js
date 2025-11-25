const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { verifyToken, isCustomer, isAdmin } = require("../middlewares/auth");

// Get all bookings (admin only)
router.get("/", verifyToken, isAdmin, bookingController.getAllBookings);

// Get customer's bookings
router.get(
  "/customer/:customerId",
  verifyToken,
  bookingController.getCustomerBookings,
);

// Get booking by ID
router.get("/:id", verifyToken, bookingController.getBookingById);

// Create booking from catalog
router.post(
  "/catalog",
  verifyToken,
  isCustomer,
  bookingController.createBookingFromCatalog,
);

// Create custom booking
router.post(
  "/custom",
  verifyToken,
  isCustomer,
  bookingController.createCustomBooking,
);

// Update booking status (admin can update any, customer can cancel their own)
router.patch("/:id/status", verifyToken, bookingController.updateBookingStatus);

// Delete booking
router.delete("/:id", verifyToken, bookingController.deleteBooking);

module.exports = router;
