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

// Process payment (creates a pending payment with calculated amount)
router.post("/process", verifyToken, paymentController.processPayment);

// Complete payment (marks as completed and confirms booking)
router.post("/:id/complete", verifyToken, paymentController.completePayment);

// Update payment status (admin only - for manual status changes like refunds)
router.patch(
  "/:id/status",
  verifyToken,
  isAdmin,
  paymentController.updatePaymentStatus,
);

module.exports = router;
