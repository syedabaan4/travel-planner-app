const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const customerModel = require("../models/customerModel");
const adminModel = require("../models/adminModel");

// Customer Registration
async function registerCustomer(req, res) {
  try {
    const { name, email, phone, username, password } = req.body;

    // Validate input
    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create customer
    const customerId = await customerModel.createCustomer({
      name,
      email,
      phone,
      username,
      password,
    });

    res.status(201).json({
      message: "Customer registered successfully",
      customerId,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ message: "Error registering customer", error: error.message });
  }
}

// Customer Login
async function loginCustomer(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    // Get customer by username
    const customer = await customerModel.getCustomerByUsername(username);

    if (!customer) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, customer.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: customer.customerId,
        username: customer.username,
        role: "customer",
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.json({
      message: "Login successful",
      token,
      customer: {
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        username: customer.username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
}

// Admin Login
async function loginAdmin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password required" });
    }

    // Get admin by username
    const admin = await adminModel.getAdminByUsername(username);

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin.adminId,
        username: admin.username,
        role: "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.json({
      message: "Admin login successful",
      token,
      admin: {
        adminId: admin.adminId,
        name: admin.name,
        email: admin.email,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
}

module.exports = {
  registerCustomer,
  loginCustomer,
  loginAdmin,
};
