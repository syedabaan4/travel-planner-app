const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Customer routes
router.post("/customer/register", authController.registerCustomer);
router.post("/customer/login", authController.loginCustomer);

// Admin routes
router.post("/admin/login", authController.loginAdmin);

module.exports = router;
