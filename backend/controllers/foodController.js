const foodModel = require("../models/foodModel");

// Get all food plans
async function getAllFood(req, res) {
  try {
    const food = await foodModel.getAllFood();
    res.json(food);
  } catch (error) {
    console.error("Error fetching food:", error);
    res
      .status(500)
      .json({ message: "Error fetching food", error: error.message });
  }
}

// Get food by ID
async function getFoodById(req, res) {
  try {
    const foodId = req.params.id;
    const food = await foodModel.getFoodById(foodId);

    if (!food) {
      return res.status(404).json({ message: "Food plan not found" });
    }

    res.json(food);
  } catch (error) {
    console.error("Error fetching food:", error);
    res
      .status(500)
      .json({ message: "Error fetching food", error: error.message });
  }
}

// Create food plan (admin only)
async function createFood(req, res) {
  try {
    const { meals, price } = req.body;

    if (!meals || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const foodId = await foodModel.createFood({
      meals,
      price,
    });

    res.status(201).json({
      message: "Food plan created successfully",
      foodId,
    });
  } catch (error) {
    console.error("Error creating food:", error);
    res
      .status(500)
      .json({ message: "Error creating food", error: error.message });
  }
}

// Update food plan (admin only)
async function updateFood(req, res) {
  try {
    const foodId = req.params.id;
    const { meals, price } = req.body;

    await foodModel.updateFood(foodId, {
      meals,
      price,
    });

    res.json({ message: "Food plan updated successfully" });
  } catch (error) {
    console.error("Error updating food:", error);
    res
      .status(500)
      .json({ message: "Error updating food", error: error.message });
  }
}

// Delete food plan (admin only)
async function deleteFood(req, res) {
  try {
    const foodId = req.params.id;
    await foodModel.deleteFood(foodId);
    res.json({ message: "Food plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting food:", error);
    res
      .status(500)
      .json({ message: "Error deleting food", error: error.message });
  }
}

module.exports = {
  getAllFood,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
};
