const db = require("../config/db");

// Get revenue report using VW_REVENUE_REPORT view
async function getRevenueReport() {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT paymentMonth, totalTransactions, totalBookings, uniqueCustomers,
              completedRevenue, pendingRevenue, refundedAmount,
              packageRevenue, customBookingRevenue
       FROM VW_REVENUE_REPORT
       ORDER BY paymentMonth DESC`,
    );
    return result.rows.map((row) => ({
      paymentMonth: row[0],
      totalTransactions: row[1],
      totalBookings: row[2],
      uniqueCustomers: row[3],
      completedRevenue: row[4],
      pendingRevenue: row[5],
      refundedAmount: row[6],
      packageRevenue: row[7],
      customBookingRevenue: row[8],
    }));
  } finally {
    if (connection) await connection.close();
  }
}

// Get dashboard summary stats
async function getDashboardStats() {
  let connection;
  try {
    connection = await db.getConnection();

    // Get total counts
    const statsResult = await connection.execute(
      `SELECT
         (SELECT COUNT(*) FROM Customer) as totalCustomers,
         (SELECT COUNT(*) FROM Booking) as totalBookings,
         (SELECT COUNT(*) FROM Booking WHERE status = 'confirmed') as confirmedBookings,
         (SELECT COUNT(*) FROM Booking WHERE status = 'pending') as pendingBookings,
         (SELECT COUNT(*) FROM Booking WHERE status = 'cancelled') as cancelledBookings,
         (SELECT NVL(SUM(amount), 0) FROM Payment WHERE status = 'completed') as totalRevenue,
         (SELECT COUNT(*) FROM Catalog) as totalCatalogs
       FROM DUAL`,
    );

    const row = statsResult.rows[0];
    return {
      totalCustomers: row[0],
      totalBookings: row[1],
      confirmedBookings: row[2],
      pendingBookings: row[3],
      cancelledBookings: row[4],
      totalRevenue: row[5],
      totalCatalogs: row[6],
    };
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getRevenueReport,
  getDashboardStats,
};
