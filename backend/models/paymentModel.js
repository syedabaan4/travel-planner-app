const db = require("../config/db");
const { generateUUID } = require("../middlewares/helpers");

// Get all payments (admin only)
async function getAllPayments() {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT p.paymentId, p.bookingId, p.amount, p.paymentDate,
              p.method, p.status, p.transactionId, c.name as customerName
       FROM Payment p
       JOIN Booking b ON p.bookingId = b.bookingId
       JOIN Customer c ON b.customerId = c.customerId
       ORDER BY p.paymentDate DESC`,
    );
    return result.rows.map((row) => ({
      paymentId: row[0],
      bookingId: row[1],
      amount: row[2],
      paymentDate: row[3],
      method: row[4],
      status: row[5],
      transactionId: row[6],
      customerName: row[7],
    }));
  } finally {
    if (connection) await connection.close();
  }
}

// Get payment by booking ID
async function getPaymentByBookingId(bookingId) {
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `SELECT paymentId, bookingId, amount, paymentDate, method, status, transactionId
       FROM Payment
       WHERE bookingId = :bookingId`,
      [bookingId],
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      paymentId: row[0],
      bookingId: row[1],
      amount: row[2],
      paymentDate: row[3],
      method: row[4],
      status: row[5],
      transactionId: row[6],
    };
  } finally {
    if (connection) await connection.close();
  }
}

// Create payment
async function createPayment(paymentData) {
  let connection;
  try {
    connection = await db.getConnection();
    const paymentId = generateUUID();

    await connection.execute(
      `INSERT INTO Payment (paymentId, bookingId, amount, method, status, transactionId)
       VALUES (:paymentId, :bookingId, :amount, :method, :status, :transactionId)`,
      {
        paymentId,
        bookingId: paymentData.bookingId,
        amount: paymentData.amount,
        method: paymentData.method,
        status: paymentData.status || "pending",
        transactionId: paymentData.transactionId || null,
      },
      { autoCommit: true },
    );

    return paymentId;
  } finally {
    if (connection) await connection.close();
  }
}

// Update payment status
async function updatePaymentStatus(paymentId, status, transactionId = null) {
  let connection;
  try {
    connection = await db.getConnection();

    let query = `UPDATE Payment SET status = :status`;
    const binds = { status, id: paymentId };

    if (transactionId) {
      query += `, transactionId = :transactionId`;
      binds.transactionId = transactionId;
    }

    query += ` WHERE paymentId = :id`;

    await connection.execute(query, binds, { autoCommit: true });
    return true;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getAllPayments,
  getPaymentByBookingId,
  createPayment,
  updatePaymentStatus,
};
