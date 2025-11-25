const express = require("express");
const router = express.Router();
const catalogController = require("../controllers/catalogController");
const { verifyToken, isAdmin } = require("../middlewares/auth");

// Public routes (anyone can view catalogs)
router.get("/", catalogController.getAllCatalogs);
router.get("/:id", catalogController.getCatalogById);

// Admin only routes
router.post("/", verifyToken, isAdmin, catalogController.createCatalog);
router.put("/:id", verifyToken, isAdmin, catalogController.updateCatalog);
router.delete("/:id", verifyToken, isAdmin, catalogController.deleteCatalog);

// Add items to catalog (admin only)
router.post(
  "/:id/hotels",
  verifyToken,
  isAdmin,
  catalogController.addHotelToCatalog,
);
router.post(
  "/:id/transport",
  verifyToken,
  isAdmin,
  catalogController.addTransportToCatalog,
);
router.post(
  "/:id/food",
  verifyToken,
  isAdmin,
  catalogController.addFoodToCatalog,
);

module.exports = router;
