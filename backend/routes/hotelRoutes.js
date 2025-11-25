const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotelController");
const { verifyToken, isAdmin } = require("../middlewares/auth");

// Public routes
router.get("/", hotelController.getAllHotels);
router.get("/:id", hotelController.getHotelById);

// Admin only routes
router.post("/", verifyToken, isAdmin, hotelController.createHotel);
router.put("/:id", verifyToken, isAdmin, hotelController.updateHotel);
router.delete("/:id", verifyToken, isAdmin, hotelController.deleteHotel);

module.exports = router;
