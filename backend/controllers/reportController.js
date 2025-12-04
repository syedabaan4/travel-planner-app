const reportModel = require("../models/reportModel");

// Get revenue report (admin only)
async function getRevenueReport(req, res) {
  try {
    const report = await reportModel.getRevenueReport();
    res.json(report);
  } catch (error) {
    console.error("Error fetching revenue report:", error);
    res
      .status(500)
      .json({ message: "Error fetching revenue report", error: error.message });
  }
}

// Get dashboard stats (admin only)
async function getDashboardStats(req, res) {
  try {
    const stats = await reportModel.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res
      .status(500)
      .json({ message: "Error fetching dashboard stats", error: error.message });
  }
}

module.exports = {
  getRevenueReport,
  getDashboardStats,
};
