const jwt = require("jsonwebtoken");

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// Check if user is customer
const isCustomer = (req, res, next) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Access denied: Customers only" });
  }
  next();
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};

module.exports = {
  verifyToken,
  isCustomer,
  isAdmin,
};
