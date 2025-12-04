const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const { verifyToken, isAdmin } = require("../middlewares/auth");

// Get all customers (admin only)
router.get("/", verifyToken, isAdmin, customerController.getAllCustomers);

// Get customer profile (own profile or admin)
router.get("/:id", verifyToken, customerController.getCustomerProfile);

// Get customer summary with booking stats and tier (uses view)
router.get("/:id/summary", verifyToken, customerController.getCustomerSummary);

// Update customer profile
router.put("/:id", verifyToken, customerController.updateCustomer);

// Delete customer (admin only)
router.delete("/:id", verifyToken, isAdmin, customerController.deleteCustomer);

module.exports = router;
