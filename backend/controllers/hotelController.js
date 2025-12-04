const hotelModel = require("../models/hotelModel");

// Get all hotels
async function getAllHotels(req, res) {
  try {
    const hotels = await hotelModel.getAllHotels();
    res.json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res
      .status(500)
      .json({ message: "Error fetching hotels", error: error.message });
  }
}

// Get hotel by ID
async function getHotelById(req, res) {
  try {
    const hotelId = req.params.id;
    const hotel = await hotelModel.getHotelById(hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.json(hotel);
  } catch (error) {
    console.error("Error fetching hotel:", error);
    res
      .status(500)
      .json({ message: "Error fetching hotel", error: error.message });
  }
}

// Get hotel availability (uses VW_HOTEL_AVAILABILITY view)
async function getHotelAvailability(req, res) {
  try {
    const availability = await hotelModel.getHotelAvailability();
    res.json(availability);
  } catch (error) {
    console.error("Error fetching hotel availability:", error);
    res.status(500).json({
      message: "Error fetching hotel availability",
      error: error.message,
    });
  }
}

// Create hotel (admin only)
async function createHotel(req, res) {
  try {
    const { hotelName, hotelAddress, availableRooms, rent } = req.body;

    if (!hotelName || !hotelAddress || !availableRooms || !rent) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const hotelId = await hotelModel.createHotel({
      hotelName,
      hotelAddress,
      availableRooms,
      rent,
    });

    res.status(201).json({
      message: "Hotel created successfully",
      hotelId,
    });
  } catch (error) {
    console.error("Error creating hotel:", error);
    res
      .status(500)
      .json({ message: "Error creating hotel", error: error.message });
  }
}

// Update hotel (admin only)
async function updateHotel(req, res) {
  try {
    const hotelId = req.params.id;
    const { hotelName, hotelAddress, availableRooms, rent } = req.body;

    await hotelModel.updateHotel(hotelId, {
      hotelName,
      hotelAddress,
      availableRooms,
      rent,
    });

    res.json({ message: "Hotel updated successfully" });
  } catch (error) {
    console.error("Error updating hotel:", error);
    res
      .status(500)
      .json({ message: "Error updating hotel", error: error.message });
  }
}

// Delete hotel (admin only)
async function deleteHotel(req, res) {
  try {
    const hotelId = req.params.id;
    await hotelModel.deleteHotel(hotelId);
    res.json({ message: "Hotel deleted successfully" });
  } catch (error) {
    console.error("Error deleting hotel:", error);
    res
      .status(500)
      .json({ message: "Error deleting hotel", error: error.message });
  }
}

module.exports = {
  getAllHotels,
  getHotelById,
  getHotelAvailability,
  createHotel,
  updateHotel,
  deleteHotel,
};
