const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { verifyToken, isAdmin } = require("../middlewares/auth");

// Get revenue report (admin only)
router.get("/revenue", verifyToken, isAdmin, reportController.getRevenueReport);

// Get dashboard stats (admin only)
router.get(
  "/dashboard",
  verifyToken,
  isAdmin,
  reportController.getDashboardStats,
);

module.exports = router;
