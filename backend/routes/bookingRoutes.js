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

// Get booking cost breakdown
router.get("/:id/total", verifyToken, bookingController.getBookingTotal);

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

// Cancel booking (customer can cancel their own, admin can cancel any)
router.post("/:id/cancel", verifyToken, bookingController.cancelBooking);

// Update booking status (admin only - for manual status changes)
router.patch(
  "/:id/status",
  verifyToken,
  isAdmin,
  bookingController.updateBookingStatus,
);

// Delete booking (admin only)
router.delete("/:id", verifyToken, isAdmin, bookingController.deleteBooking);

module.exports = router;
