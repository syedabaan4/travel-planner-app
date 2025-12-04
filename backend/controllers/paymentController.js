const paymentModel = require("../models/paymentModel");
const bookingModel = require("../models/bookingModel");

// Get all payments (admin only)
async function getAllPayments(req, res) {
  try {
    const payments = await paymentModel.getAllPayments();
    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res
      .status(500)
      .json({ message: "Error fetching payments", error: error.message });
  }
}

// Get payment by booking ID
async function getPaymentByBookingId(req, res) {
  try {
    const bookingId = req.params.bookingId;
    const payment = await paymentModel.getPaymentByBookingId(bookingId);

    if (!payment) {
      return res
        .status(404)
        .json({ message: "Payment not found for this booking" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res
      .status(500)
      .json({ message: "Error fetching payment", error: error.message });
  }
}

// Process payment using stored procedure
// Creates a pending payment with calculated amount from booking
async function processPayment(req, res) {
  try {
    const { bookingId, method, transactionId } = req.body;

    if (!bookingId || !method) {
      return res
        .status(400)
        .json({ message: "bookingId and method are required" });
    }

    // Validate payment method
    const validMethods = [
      "credit_card",
      "debit_card",
      "paypal",
      "bank_transfer",
    ];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        message:
          "Invalid payment method. Valid options: " + validMethods.join(", "),
      });
    }

    // Get booking to check ownership
    const booking = await bookingModel.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // If customer role, ensure they can only pay for their own booking
    if (req.user.role === "customer" && req.user.id != booking.customerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await paymentModel.processPayment(
      bookingId,
      method,
      transactionId,
    );

    res.status(201).json({
      message: "Payment processed successfully",
      paymentId: result.paymentId,
      amount: result.amount,
      status: "pending",
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    // Handle specific Oracle errors from stored procedure
    if (error.message.includes("ORA-20005")) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (error.message.includes("ORA-20006")) {
      return res
        .status(400)
        .json({ message: "Cannot process payment for cancelled booking" });
    }
    if (error.message.includes("ORA-20007")) {
      return res
        .status(400)
        .json({ message: "Payment already exists for this booking" });
    }
    if (error.message.includes("ORA-20008")) {
      return res.status(400).json({ message: "Invalid payment method" });
    }
    if (error.message.includes("ORA-20009")) {
      return res
        .status(400)
        .json({ message: "Booking has no items to pay for" });
    }
    res
      .status(500)
      .json({ message: "Error processing payment", error: error.message });
  }
}

// Complete payment using stored procedure
// Marks payment as completed and confirms the booking
async function completePayment(req, res) {
  try {
    const paymentId = req.params.id;
    const { transactionId } = req.body;

    await paymentModel.completePayment(paymentId, transactionId);

    res.json({
      message: "Payment completed successfully. Booking confirmed.",
      status: "completed",
    });
  } catch (error) {
    console.error("Error completing payment:", error);
    // Handle specific Oracle errors from stored procedure
    if (error.message.includes("ORA-20010")) {
      return res.status(404).json({ message: "Payment not found" });
    }
    if (error.message.includes("ORA-20011")) {
      return res.status(400).json({
        message: "Payment is not pending and cannot be completed",
      });
    }
    res
      .status(500)
      .json({ message: "Error completing payment", error: error.message });
  }
}

// Update payment status (admin only - for manual status changes like refunds)
async function updatePaymentStatus(req, res) {
  try {
    const paymentId = req.params.id;
    const { status, transactionId } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    if (!["pending", "completed", "failed", "refunded"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    await paymentModel.updatePaymentStatus(paymentId, status, transactionId);
    res.json({ message: "Payment status updated successfully" });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res
      .status(500)
      .json({ message: "Error updating payment status", error: error.message });
  }
}

module.exports = {
  getAllPayments,
  getPaymentByBookingId,
  processPayment,
  completePayment,
  updatePaymentStatus,
};
