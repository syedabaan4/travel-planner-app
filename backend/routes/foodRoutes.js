const express = require("express");
const router = express.Router();
const foodController = require("../controllers/foodController");
const { verifyToken, isAdmin } = require("../middlewares/auth");

// Public routes
router.get("/", foodController.getAllFood);
router.get("/:id", foodController.getFoodById);

// Admin only routes
router.post("/", verifyToken, isAdmin, foodController.createFood);
router.put("/:id", verifyToken, isAdmin, foodController.updateFood);
router.delete("/:id", verifyToken, isAdmin, foodController.deleteFood);

module.exports = router;
