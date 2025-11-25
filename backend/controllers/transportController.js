const transportModel = require("../models/transportModel");

// Get all transport options
async function getAllTransport(req, res) {
  try {
    const transport = await transportModel.getAllTransport();
    res.json(transport);
  } catch (error) {
    console.error("Error fetching transport:", error);
    res
      .status(500)
      .json({ message: "Error fetching transport", error: error.message });
  }
}

// Get transport by ID
async function getTransportById(req, res) {
  try {
    const transportId = req.params.id;
    const transport = await transportModel.getTransportById(transportId);

    if (!transport) {
      return res.status(404).json({ message: "Transport not found" });
    }

    res.json(transport);
  } catch (error) {
    console.error("Error fetching transport:", error);
    res
      .status(500)
      .json({ message: "Error fetching transport", error: error.message });
  }
}

// Create transport (admin only)
async function createTransport(req, res) {
  try {
    const { type, noOfSeats, fare } = req.body;

    if (!type || !noOfSeats || !fare) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const transportId = await transportModel.createTransport({
      type,
      noOfSeats,
      fare,
    });

    res.status(201).json({
      message: "Transport created successfully",
      transportId,
    });
  } catch (error) {
    console.error("Error creating transport:", error);
    res
      .status(500)
      .json({ message: "Error creating transport", error: error.message });
  }
}

// Update transport (admin only)
async function updateTransport(req, res) {
  try {
    const transportId = req.params.id;
    const { type, noOfSeats, fare } = req.body;

    await transportModel.updateTransport(transportId, {
      type,
      noOfSeats,
      fare,
    });

    res.json({ message: "Transport updated successfully" });
  } catch (error) {
    console.error("Error updating transport:", error);
    res
      .status(500)
      .json({ message: "Error updating transport", error: error.message });
  }
}

// Delete transport (admin only)
async function deleteTransport(req, res) {
  try {
    const transportId = req.params.id;
    await transportModel.deleteTransport(transportId);
    res.json({ message: "Transport deleted successfully" });
  } catch (error) {
    console.error("Error deleting transport:", error);
    res
      .status(500)
      .json({ message: "Error deleting transport", error: error.message });
  }
}

module.exports = {
  getAllTransport,
  getTransportById,
  createTransport,
  updateTransport,
  deleteTransport,
};
