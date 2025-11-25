const express = require("express");
const cors = require("cors");
const db = require("./config/db");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const catalogRoutes = require("./routes/catalogRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const transportRoutes = require("./routes/transportRoutes");
const foodRoutes = require("./routes/foodRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Initialize database connection
db.initialize()
  .then(() => {
    console.log("✅ Database initialized successfully");
  })
  .catch((err) => {
    console.error("❌ Database initialization failed:", err);
    process.exit(1);
  });

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Travel Planner API Server",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      customers: "/api/customers",
      catalogs: "/api/catalogs",
      hotels: "/api/hotels",
      transport: "/api/transport",
      food: "/api/food",
      bookings: "/api/bookings",
      payments: "/api/payments",
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/catalogs", catalogRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏳ Shutting down gracefully...");
  await db.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⏳ Shutting down gracefully...");
  await db.close();
  process.exit(0);
});
