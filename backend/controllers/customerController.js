const customerModel = require("../models/customerModel");

// Get all customers (admin only)
async function getAllCustomers(req, res) {
  try {
    const customers = await customerModel.getAllCustomers();
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res
      .status(500)
      .json({ message: "Error fetching customers", error: error.message });
  }
}

// Get customer profile (own profile for customer, any for admin)
async function getCustomerProfile(req, res) {
  try {
    const customerId = req.params.id;

    // If customer role, ensure they can only access their own profile
    if (req.user.role === "customer" && req.user.id != customerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const customer = await customerModel.getCustomerById(customerId);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    res
      .status(500)
      .json({ message: "Error fetching customer", error: error.message });
  }
}

// Update customer profile
async function updateCustomer(req, res) {
  try {
    const customerId = req.params.id;

    // If customer role, ensure they can only update their own profile
    if (req.user.role === "customer" && req.user.id != customerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, email, phone, password } = req.body;

    await customerModel.updateCustomer(customerId, {
      name,
      email,
      phone,
      password,
    });

    res.json({ message: "Customer updated successfully" });
  } catch (error) {
    console.error("Error updating customer:", error);
    res
      .status(500)
      .json({ message: "Error updating customer", error: error.message });
  }
}

// Delete customer (admin only)
async function deleteCustomer(req, res) {
  try {
    const customerId = req.params.id;

    await customerModel.deleteCustomer(customerId);
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res
      .status(500)
      .json({ message: "Error deleting customer", error: error.message });
  }
}

module.exports = {
  getAllCustomers,
  getCustomerProfile,
  updateCustomer,
  deleteCustomer,
};
