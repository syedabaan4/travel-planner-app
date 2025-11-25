const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { verifyToken, isAdmin } = require("../middlewares/auth");

// Get all payments (admin only)
router.get("/", verifyToken, isAdmin, paymentController.getAllPayments);

// Get payment by booking ID
router.get(
  "/booking/:bookingId",
  verifyToken,
  paymentController.getPaymentByBookingId,
);

// Create payment
router.post("/", verifyToken, paymentController.createPayment);

// Update payment status (admin only)
router.patch(
  "/:id/status",
  verifyToken,
  isAdmin,
  paymentController.updatePaymentStatus,
);

module.exports = router;
