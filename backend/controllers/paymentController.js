const paymentModel = require("../models/paymentModel");

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

// Create payment
async function createPayment(req, res) {
  try {
    const { bookingId, amount, method, transactionId } = req.body;

    if (!bookingId || !amount || !method) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const paymentId = await paymentModel.createPayment({
      bookingId,
      amount,
      method,
      status: "pending",
      transactionId,
    });

    res.status(201).json({
      message: "Payment created successfully",
      paymentId,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res
      .status(500)
      .json({ message: "Error creating payment", error: error.message });
  }
}

// Update payment status
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
  createPayment,
  updatePaymentStatus,
};
