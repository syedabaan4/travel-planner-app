const express = require("express");
const router = express.Router();
const transportController = require("../controllers/transportController");
const { verifyToken, isAdmin } = require("../middlewares/auth");

// Public routes
router.get("/", transportController.getAllTransport);
router.get("/:id", transportController.getTransportById);

// Admin only routes
router.post("/", verifyToken, isAdmin, transportController.createTransport);
router.put("/:id", verifyToken, isAdmin, transportController.updateTransport);
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  transportController.deleteTransport,
);

module.exports = router;
