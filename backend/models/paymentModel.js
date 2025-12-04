const db = require("../config/db");
const oracledb = require("oracledb");

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

// Process payment using stored procedure SP_PROCESS_PAYMENT
// This creates a pending payment with calculated amount from booking
async function processPayment(bookingId, method, transactionId = null) {
  let connection;
  try {
    connection = await db.getConnection();

    const result = await connection.execute(
      `BEGIN
         SP_PROCESS_PAYMENT(
           p_booking_id => :bookingId,
           p_method => :method,
           p_transaction_id => :transactionId,
           p_payment_id => :paymentId,
           p_amount => :amount
         );
       END;`,
      {
        bookingId,
        method,
        transactionId,
        paymentId: {
          dir: oracledb.BIND_OUT,
          type: oracledb.STRING,
          maxSize: 36,
        },
        amount: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );

    return {
      paymentId: result.outBinds.paymentId,
      amount: result.outBinds.amount,
    };
  } finally {
    if (connection) await connection.close();
  }
}

// Complete payment using stored procedure SP_COMPLETE_PAYMENT
// This marks payment as completed and confirms the booking
async function completePayment(paymentId, transactionId = null) {
  let connection;
  try {
    connection = await db.getConnection();

    await connection.execute(
      `BEGIN
         SP_COMPLETE_PAYMENT(
           p_payment_id => :paymentId,
           p_transaction_id => :transactionId
         );
       END;`,
      {
        paymentId,
        transactionId,
      },
    );

    return true;
  } finally {
    if (connection) await connection.close();
  }
}

// Update payment status (for manual status changes like refunds)
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
  processPayment,
  completePayment,
  updatePaymentStatus,
};
