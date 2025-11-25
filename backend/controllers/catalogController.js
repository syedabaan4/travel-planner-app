const catalogModel = require("../models/catalogModel");

// Get all catalog packages
async function getAllCatalogs(req, res) {
  try {
    const catalogs = await catalogModel.getAllCatalogs();
    res.json(catalogs);
  } catch (error) {
    console.error("Error fetching catalogs:", error);
    res
      .status(500)
      .json({ message: "Error fetching catalogs", error: error.message });
  }
}

// Get catalog by ID with full details
async function getCatalogById(req, res) {
  try {
    const catalogId = req.params.id;
    const catalog = await catalogModel.getCatalogById(catalogId);

    if (!catalog) {
      return res.status(404).json({ message: "Catalog not found" });
    }

    res.json(catalog);
  } catch (error) {
    console.error("Error fetching catalog:", error);
    res
      .status(500)
      .json({ message: "Error fetching catalog", error: error.message });
  }
}

// Create catalog package (admin only)
async function createCatalog(req, res) {
  try {
    const {
      packageName,
      destination,
      description,
      noOfDays,
      budget,
      departure,
      arrival,
    } = req.body;

    if (
      !packageName ||
      !destination ||
      !noOfDays ||
      !budget ||
      !departure ||
      !arrival
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const catalogId = await catalogModel.createCatalog({
      packageName,
      destination,
      description,
      noOfDays,
      budget,
      departure,
      arrival,
    });

    res.status(201).json({
      message: "Catalog created successfully",
      catalogId,
    });
  } catch (error) {
    console.error("Error creating catalog:", error);
    res
      .status(500)
      .json({ message: "Error creating catalog", error: error.message });
  }
}

// Update catalog (admin only)
async function updateCatalog(req, res) {
  try {
    const catalogId = req.params.id;
    const {
      packageName,
      destination,
      description,
      noOfDays,
      budget,
      departure,
      arrival,
    } = req.body;

    await catalogModel.updateCatalog(catalogId, {
      packageName,
      destination,
      description,
      noOfDays,
      budget,
      departure,
      arrival,
    });

    res.json({ message: "Catalog updated successfully" });
  } catch (error) {
    console.error("Error updating catalog:", error);
    res
      .status(500)
      .json({ message: "Error updating catalog", error: error.message });
  }
}

// Delete catalog (admin only)
async function deleteCatalog(req, res) {
  try {
    const catalogId = req.params.id;
    await catalogModel.deleteCatalog(catalogId);
    res.json({ message: "Catalog deleted successfully" });
  } catch (error) {
    console.error("Error deleting catalog:", error);
    res
      .status(500)
      .json({ message: "Error deleting catalog", error: error.message });
  }
}

// Add hotel to catalog (admin only)
async function addHotelToCatalog(req, res) {
  try {
    const catalogId = req.params.id;
    const { hotelId, roomsIncluded } = req.body;

    if (!hotelId) {
      return res.status(400).json({ message: "hotelId is required" });
    }

    await catalogModel.addHotelToCatalog(catalogId, hotelId, roomsIncluded);
    res.json({ message: "Hotel added to catalog successfully" });
  } catch (error) {
    console.error("Error adding hotel to catalog:", error);
    res
      .status(500)
      .json({ message: "Error adding hotel to catalog", error: error.message });
  }
}

// Add transport to catalog (admin only)
async function addTransportToCatalog(req, res) {
  try {
    const catalogId = req.params.id;
    const { transportId, seatsIncluded } = req.body;

    if (!transportId) {
      return res.status(400).json({ message: "transportId is required" });
    }

    await catalogModel.addTransportToCatalog(
      catalogId,
      transportId,
      seatsIncluded,
    );
    res.json({ message: "Transport added to catalog successfully" });
  } catch (error) {
    console.error("Error adding transport to catalog:", error);
    res
      .status(500)
      .json({
        message: "Error adding transport to catalog",
        error: error.message,
      });
  }
}

// Add food to catalog (admin only)
async function addFoodToCatalog(req, res) {
  try {
    const catalogId = req.params.id;
    const { foodId } = req.body;

    if (!foodId) {
      return res.status(400).json({ message: "foodId is required" });
    }

    await catalogModel.addFoodToCatalog(catalogId, foodId);
    res.json({ message: "Food added to catalog successfully" });
  } catch (error) {
    console.error("Error adding food to catalog:", error);
    res
      .status(500)
      .json({ message: "Error adding food to catalog", error: error.message });
  }
}

module.exports = {
  getAllCatalogs,
  getCatalogById,
  createCatalog,
  updateCatalog,
  deleteCatalog,
  addHotelToCatalog,
  addTransportToCatalog,
  addFoodToCatalog,
};
